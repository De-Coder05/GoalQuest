import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const escalations = await prisma.escalation.findMany({
      include: {
        employee: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(escalations);
  } catch (error) {
    console.error('GET /api/escalations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, action } = await req.json();

    if (action === 'resolve') {
      await prisma.escalation.update({
        where: { id },
        data: { status: 'Resolved' },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'trigger_mock') {
      const emp = await prisma.user.findFirst({ where: { role: 'EMPLOYEE' } });
      if (emp) {
        await prisma.escalation.create({
          data: {
            employeeId: emp.id,
            rule: "Goals not submitted within 5 days of cycle start",
            status: "Pending",
          }
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/escalations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
