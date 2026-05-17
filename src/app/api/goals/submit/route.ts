import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const body = await req.json();
    const { cycleId } = body;

    const goals = await prisma.goal.findMany({
      where: { userId: user.id, cycleId, status: 'DRAFT' },
    });

    if (goals.length === 0) {
      return NextResponse.json({ error: 'No draft goals to submit' }, { status: 400 });
    }

    const allGoals = await prisma.goal.findMany({
      where: { userId: user.id, cycleId },
    });
    const totalWeightage = allGoals.reduce((sum, g) => sum + g.weightage, 0);
    if (Math.abs(totalWeightage - 100) > 0.01) {
      return NextResponse.json(
        { error: `Total weightage must be 100%. Current: ${totalWeightage}%` },
        { status: 400 }
      );
    }

    await prisma.goal.updateMany({
      where: { userId: user.id, cycleId, status: { in: ['DRAFT', 'RETURNED'] } },
      data: { status: 'SUBMITTED' },
    });

    for (const goal of goals) {
      await prisma.auditLog.create({
        data: {
          goalId: goal.id,
          userId: user.id,
          action: 'SUBMITTED',
          field: 'status',
          oldValue: 'DRAFT',
          newValue: 'SUBMITTED',
        },
      });
    }

    const userData = await prisma.user.findUnique({ where: { id: user.id } });
    if (userData?.managerId) {
      await prisma.notification.create({
        data: {
          userId: userData.managerId,
          type: 'GOAL_SUBMITTED',
          title: 'Goals Submitted for Review',
          message: `${userData.name} has submitted ${allGoals.length} goals for your review.`,
        },
      });
    }

    console.log('\n--- 📧 MOCK EMAIL NOTIFICATION ---');
    console.log(`To: ${userData?.managerId || 'manager'}@atomberg.com`);
    console.log(`Subject: ACTION REQUIRED: Goal Sheet Submitted by ${userData?.name || 'Employee'}`);
    console.log(`Body: ${userData?.name || 'Employee'} has submitted ${goals.length} goals for the active cycle. Please review and approve in the Performance Portal.`);
    console.log('--- 💬 MOCK TEAMS NOTIFICATION (Adaptive Card) ---');
    console.log(`To: Manager Channel`);
    console.log(`Card: { title: "Goal Submission", user: "${userData?.name || 'Employee'}", link: "https://performance.atomberg.com/dashboard/approvals" }\n`);

    return NextResponse.json({ success: true, count: goals.length });
  } catch (error) {
    console.error('POST /api/goals/submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
