import { Router, Request, Response } from 'express';
import { prisma } from '@empops/database';
import { AttendanceMode, AttendanceStatus, PunchType } from '@empops/shared';

export const biometricPushRouter = Router();

// 1. ADMS Handshake: GET /api/attendance/push/cdata
biometricPushRouter.get('/cdata', async (req: Request, res: Response) => {
  const sn = (req.query.SN as string) || 'UNKNOWN_DEVICE';
  console.log(`[Biometric Hardware] Device Handshake from SN: ${sn}`);

  // Standard ZKTeco / eSSL ADMS protocol response
  const configResponse = [
    `GET OPTION FROM: ${sn}`,
    'Stamp=9999',
    'OpStamp=9999',
    'ErrorDelay=30',
    'Delay=10',
    'TransTimes=00:00;14:05',
    'TransInterval=1',
    'TransFlag=1111000000',
    'TimeZone=5.5',
    'Realtime=1',
    'Encrypt=0',
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain');
  return res.send(configResponse);
});

// 2. ADMS Punch Ingestion: POST /api/attendance/push/cdata
biometricPushRouter.post('/cdata', async (req: Request, res: Response) => {
  try {
    const sn = (req.query.SN as string) || 'UNKNOWN_DEVICE';
    const table = (req.query.table as string) || 'ATTLOG';

    // Find default tenant
    const tenant = await prisma.tenant.findFirst({ where: { slug: 'acme' } });
    if (!tenant) {
      return res.status(404).send('Tenant not found');
    }

    console.log(`[Biometric Hardware] Received punch stream from SN: ${sn}, Table: ${table}`);

    let count = 0;
    // Handle text body or raw stream
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const lines = rawBody.split('\n').filter((l: string) => l.trim().length > 0);

    for (const line of lines) {
      // Standard punch line: "EMP-004\t2026-09-16 09:05:00\t1\t1"
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const empCode = parts[0].trim();
        const punchTime = new Date(parts[1].trim());

        const employee = await prisma.employee.findFirst({
          where: { tenantId: tenant.id, employeeCode: empCode },
        });

        if (employee) {
          await prisma.attendancePunch.create({
            data: {
              tenantId: tenant.id,
              employeeId: employee.id,
              timestamp: isNaN(punchTime.getTime()) ? new Date() : punchTime,
              punchType: PunchType.CHECK_IN,
              mode: AttendanceMode.BIOMETRIC_DEVICE,
              isWithinGeofence: true,
              deviceId: sn,
            },
          });
          count++;
        }
      }
    }

    res.setHeader('Content-Type', 'text/plain');
    return res.send(`OK: ${count}`);
  } catch (error: any) {
    console.error('[Biometric Hardware] Ingestion error:', error);
    return res.status(500).send('ERROR');
  }
});

// 3. JSON Biometric Push for Modern Smart Terminals / APIs
// POST /api/attendance/push/json
biometricPushRouter.post('/json', async (req: Request, res: Response) => {
  try {
    const { deviceSn, tenantSlug = 'acme', punches } = req.body;

    const tenant = await prisma.tenant.findFirst({ where: { slug: tenantSlug } });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    if (!Array.isArray(punches)) {
      return res.status(400).json({ error: 'punches must be an array' });
    }

    let ingestedCount = 0;
    for (const p of punches) {
      const employee = await prisma.employee.findFirst({
        where: { tenantId: tenant.id, employeeCode: p.employeeCode },
      });

      if (employee) {
        const punchDate = p.timestamp ? new Date(p.timestamp) : new Date();
        await prisma.attendancePunch.create({
          data: {
            tenantId: tenant.id,
            employeeId: employee.id,
            timestamp: punchDate,
            punchType: p.punchType || PunchType.CHECK_IN,
            mode: AttendanceMode.BIOMETRIC_DEVICE,
            isWithinGeofence: true,
            deviceId: deviceSn,
          },
        });

        // Update daily attendance
        const todayStr = punchDate.toISOString().split('T')[0];
        const existingDaily = await prisma.dailyAttendance.findUnique({
          where: {
            tenantId_employeeId_date: {
              tenantId: tenant.id,
              employeeId: employee.id,
              date: todayStr,
            },
          },
        });

        if (!existingDaily) {
          await prisma.dailyAttendance.create({
            data: {
              tenantId: tenant.id,
              employeeId: employee.id,
              date: todayStr,
              firstCheckIn: punchDate,
              status: AttendanceStatus.PRESENT,
              isLate: false,
            },
          });
        }

        ingestedCount++;
      }
    }

    return res.status(201).json({
      success: true,
      deviceSn,
      ingestedCount,
      message: `Successfully processed ${ingestedCount} biometric records`,
    });
  } catch (error: any) {
    console.error('[Biometric JSON] Ingestion error:', error);
    return res.status(500).json({ error: 'Failed to process biometric punches' });
  }
});
