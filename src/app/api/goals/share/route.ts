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
      return NextResponse.json({ error: 'Only managers/admins can share goals' }, { status: 403 });
    }

    const body = await req.json();
    const { goalData, employeeIds } = body;

    if (!goalData || !employeeIds || employeeIds.length === 0) {
      return NextResponse.json({ error: 'Missing goal data or employee IDs' }, { status: 400 });
    }

    const createdGoals = [];
    for (const empId of employeeIds) {
      const existingGoals = await prisma.goal.count({
        where: { userId: empId, cycleId: goalData.cycleId },
      });

      if (existingGoals >= 8) {
        continue; // skip if employee already has 8 goals
      }

      const goal = await prisma.goal.create({
        data: {
          userId: empId,
          cycleId: goalData.cycleId,
          thrustArea: goalData.thrustArea,
          title: goalData.title,
          description: goalData.description || '',
          uomType: goalData.uomType,
          target: String(goalData.target),
          weightage: goalData.weightage || 10,
          status: 'DRAFT',
          isShared: true,
        },
      });

      createdGoals.push(goal);

      await prisma.notification.create({
        data: {
          userId: empId,
          type: 'GOAL_SUBMITTED',
          title: 'Shared Goal Assigned',
          message: `A departmental KPI "${goalData.title}" has been shared with you by ${user.name}. You can adjust the weightage.`,
        },
      });
    }

    return NextResponse.json({ success: true, count: createdGoals.length });
  } catch (error) {
    console.error('POST /api/goals/share error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
