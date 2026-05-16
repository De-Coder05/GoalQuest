import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/goals/submit - submit goals for approval
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const body = await req.json();
    const { cycleId } = body;

    // Get all draft goals for this cycle
    const goals = await prisma.goal.findMany({
      where: { userId: user.id, cycleId, status: 'DRAFT' },
    });

    if (goals.length === 0) {
      return NextResponse.json({ error: 'No draft goals to submit' }, { status: 400 });
    }

    // Validate total weightage = 100%
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

    // Update all draft goals to submitted
    await prisma.goal.updateMany({
      where: { userId: user.id, cycleId, status: { in: ['DRAFT', 'RETURNED'] } },
      data: { status: 'SUBMITTED' },
    });

    // Create audit logs
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

    // Notify manager
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

    return NextResponse.json({ success: true, count: goals.length });
  } catch (error) {
    console.error('POST /api/goals/submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
