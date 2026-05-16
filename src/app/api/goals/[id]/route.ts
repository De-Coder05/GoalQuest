import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/goals/[id] - update a goal
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

    // Check if goal is locked
    if (goal.status === 'LOCKED' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Goal is locked. Only Admin can modify.' }, { status: 403 });
    }

    // If shared goal, only allow weightage changes by recipient
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

    // Log changes for audit
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

    // Create audit logs
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

// DELETE /api/goals/[id] - delete a goal
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

    // Delete related records first
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
