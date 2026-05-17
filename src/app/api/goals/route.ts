import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'my'; // my, team, all
    const cycleId = searchParams.get('cycleId');
    const userId = searchParams.get('userId');

    let where: any = {};

    if (cycleId) where.cycleId = cycleId;

    if (userId) {
      where.userId = userId;
    } else if (view === 'my') {
      where.userId = user.id;
    } else if (view === 'team' && user.role === 'MANAGER') {
      const teamMembers = await prisma.user.findMany({
        where: { managerId: user.id },
        select: { id: true },
      });
      where.userId = { in: teamMembers.map((m: any) => m.id) };
    } else if (view === 'all' && user.role === 'ADMIN') {
    } else {
      where.userId = user.id;
    }

    const goals = await prisma.goal.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
        cycle: true,
        achievements: true,
        checkIns: { include: { manager: { select: { name: true } } } },
        sharedFrom: { select: { id: true, title: true, userId: true } },
        sharedCopies: { select: { id: true, userId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('GET /api/goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const body = await req.json();
    const { thrustArea, title, description, uomType, target, weightage, cycleId } = body;

    if (!thrustArea || !title || !uomType || !target || weightage === undefined || !cycleId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (weightage < 10) {
      return NextResponse.json({ error: 'Minimum weightage per goal is 10%' }, { status: 400 });
    }

    const existingGoals = await prisma.goal.count({
      where: { userId: user.id, cycleId },
    });

    if (existingGoals >= 8) {
      return NextResponse.json({ error: 'Maximum 8 goals allowed per cycle' }, { status: 400 });
    }

    const existingWeightage = await prisma.goal.aggregate({
      where: { userId: user.id, cycleId },
      _sum: { weightage: true },
    });

    const totalWeightage = (existingWeightage._sum.weightage || 0) + weightage;
    if (totalWeightage > 100) {
      return NextResponse.json(
        { error: `Total weightage would exceed 100% (current: ${existingWeightage._sum.weightage || 0}%)` },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        cycleId,
        thrustArea,
        title,
        description: description || '',
        uomType,
        target: String(target),
        weightage,
        status: 'DRAFT',
      },
      include: {
        user: { select: { id: true, name: true, email: true, department: true } },
        cycle: true,
        achievements: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        goalId: goal.id,
        userId: user.id,
        action: 'CREATED',
        field: 'goal',
        newValue: title,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('POST /api/goals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
