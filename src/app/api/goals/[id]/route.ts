import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const { id } = await params;
    const body = await req.json();

    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (goal.status === 'LOCKED' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Goal is locked. Only Admin can modify.' }, { status: 403 });
    }

    if (goal.isShared && goal.userId === user.id && goal.sharedFromId) {
      const allowedFields = ['weightage'];
      const updateKeys = Object.keys(body);
      const hasDisallowed = updateKeys.some(k => !allowedFields.includes(k));
      if (hasDisallowed) {
        return NextResponse.json(
          { error: 'Shared goals: only weightage can be modified' },
          { status: 400 }
        );
      }
    }

    if (body.weightage !== undefined) {
      if (body.weightage < 10) {
        return NextResponse.json({ error: 'Minimum weightage per goal is 10%' }, { status: 400 });
      }

      const allGoals = await prisma.goal.findMany({
        where: { userId: goal.userId, cycleId: goal.cycleId },
        select: { id: true, weightage: true }
      });
      
      const currentTotal = allGoals.reduce((sum, g) => sum + (g.id === id ? 0 : g.weightage), 0);
      const newTotal = currentTotal + body.weightage;
      
      if (newTotal > 100) {
        return NextResponse.json(
          { error: `Total weightage would exceed 100% (current total with this update: ${newTotal}%)` },
          { status: 400 }
        );
      }
    }

    const changes: { field: string; oldValue: string; newValue: string }[] = [];
    for (const [key, value] of Object.entries(body)) {
      if ((goal as any)[key] !== undefined && String((goal as any)[key]) !== String(value)) {
        changes.push({
          field: key,
          oldValue: String((goal as any)[key]),
          newValue: String(value),
        });
      }
    }

    const updatedGoal = await prisma.goal.update({
      where: { id },
      data: body,
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
        cycle: true,
        achievements: true,
        checkIns: { include: { manager: { select: { name: true } } } },
      },
    });

    for (const change of changes) {
      await prisma.auditLog.create({
        data: {
          goalId: id,
          userId: user.id,
          action: goal.status === 'LOCKED' ? 'UPDATED_AFTER_LOCK' : 'UPDATED',
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
        },
      });
    }

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error('PUT /api/goals/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const { id } = await params;

    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (goal.status === 'LOCKED' || goal.status === 'APPROVED') {
      return NextResponse.json({ error: 'Cannot delete locked or approved goals' }, { status: 403 });
    }

    if (goal.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.achievement.deleteMany({ where: { goalId: id } });
    await prisma.checkIn.deleteMany({ where: { goalId: id } });
    await prisma.auditLog.deleteMany({ where: { goalId: id } });
    await prisma.goal.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/goals/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
