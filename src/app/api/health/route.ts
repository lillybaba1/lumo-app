import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: { status: 'ok' | 'error'; latencyMs?: number; error?: string };
    memory: { status: 'ok' | 'warning'; usedMB: number; totalMB: number };
  };
}

const startTime = Date.now();

export async function GET() {
  const health: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks: {
      database: { status: 'ok' },
      memory: { status: 'ok', usedMB: 0, totalMB: 0 },
    },
  };

  // Check database connection
  try {
    const dbStart = Date.now();
    const { error } = await supabaseAdmin
      .from('site_settings')
      .select('id')
      .limit(1);
    
    const latencyMs = Date.now() - dbStart;
    
    if (error) {
      health.checks.database = { 
        status: 'error', 
        error: error.message,
        latencyMs 
      };
      health.status = 'degraded';
    } else {
      health.checks.database = { status: 'ok', latencyMs };
    }
  } catch (error) {
    health.checks.database = { 
      status: 'error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
    health.status = 'unhealthy';
  }

  // Check memory usage (Node.js specific)
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memUsage = process.memoryUsage();
    const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    
    health.checks.memory = {
      status: usedMB / totalMB > 0.9 ? 'warning' : 'ok',
      usedMB,
      totalMB,
    };
    
    if (health.checks.memory.status === 'warning' && health.status === 'healthy') {
      health.status = 'degraded';
    }
  }

  const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
