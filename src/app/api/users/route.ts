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
    const view = searchParams.get('view') || 'team';

    let where: any = {};

    if (view === 'team' && user.role === 'MANAGER') {
      where.managerId = user.id;
    } else if (view === 'all' && (user.role === 'ADMIN' || user.role === 'MANAGER')) {
    } else {
      where.id = user.id;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        managerId: true,
        manager: { select: { name: true } },
        _count: {
          select: {
            goals: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
