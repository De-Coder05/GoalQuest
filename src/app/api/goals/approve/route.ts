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
    if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only managers can approve goals' }, { status: 403 });
    }

    const body = await req.json();
    const { goalIds, action, comment } = body; // action: 'approve' or 'return'

    if (!goalIds || !Array.isArray(goalIds) || goalIds.length === 0) {
      return NextResponse.json({ error: 'No goals specified' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'LOCKED' : 'RETURNED';

    await prisma.goal.updateMany({
      where: { id: { in: goalIds }, status: 'SUBMITTED' },
      data: { status: newStatus },
    });

    const goals = await prisma.goal.findMany({
      where: { id: { in: goalIds } },
      include: { user: true },
    });

    const employeeIds = new Set<string>();
    for (const goal of goals) {
      employeeIds.add(goal.userId);
      await prisma.auditLog.create({
        data: {
          goalId: goal.id,
          userId: user.id,
          action: action === 'approve' ? 'APPROVED' : 'RETURNED',
          field: 'status',
          oldValue: 'SUBMITTED',
          newValue: newStatus,
        },
      });
    }

    for (const empId of employeeIds) {
      const emp = goals.find(g => g.userId === empId)?.user;
      await prisma.notification.create({
        data: {
          userId: empId,
          type: action === 'approve' ? 'GOAL_APPROVED' : 'GOAL_RETURNED',
          title: action === 'approve' ? 'Goals Approved' : 'Goals Returned for Rework',
          message: action === 'approve'
            ? `Your goals have been approved and locked by ${user.name}.`
            : `Your goals have been returned by ${user.name}. ${comment || 'Please review and resubmit.'}`,
        },
      });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('POST /api/goals/approve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
