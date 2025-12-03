import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-admin';
import { getPublishedBoutiques, updateBoutique } from '@/services/boutiqueService';

// GET - Fetch all boutiques with optional filters
export async function GET(request: NextRequest) {
  try {
    await requireAdmin({ redirect: false });
    
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '100');
    
    let boutiques = await getPublishedBoutiques({ limit });
    
    // Apply filters
    if (featured === 'true') {
      boutiques = boutiques.filter(b => b.isFeatured);
    } else if (featured === 'false') {
      boutiques = boutiques.filter(b => !b.isFeatured);
    }
    
    return NextResponse.json({ 
      success: true, 
      data: boutiques,
      count: boutiques.length
    });
  } catch (error: any) {
    console.error('Error fetching boutiques:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch boutiques' },
      { status: error.statusCode || 500 }
    );
  }
}

// PUT - Bulk update boutiques (e.g., feature/unfeature multiple)
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin({ redirect: false });
    
    const body = await request.json();
    const { boutiqueIds, updates } = body as {
      boutiqueIds: string[];
      updates: {
        isFeatured?: boolean;
        isPublished?: boolean;
      };
    };
    
    if (!boutiqueIds || !Array.isArray(boutiqueIds) || boutiqueIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'boutiqueIds array is required' },
        { status: 400 }
      );
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'updates object is required' },
        { status: 400 }
      );
    }
    
    let successCount = 0;
    let failedIds: string[] = [];
    
    for (const boutiqueId of boutiqueIds) {
      try {
        const success = await updateBoutique(boutiqueId, updates);
        if (success) {
          successCount++;
        } else {
          failedIds.push(boutiqueId);
        }
      } catch (err) {
        failedIds.push(boutiqueId);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated ${successCount} of ${boutiqueIds.length} boutiques`,
      successCount,
      failedCount: failedIds.length,
      failedIds: failedIds.length > 0 ? failedIds : undefined
    });
  } catch (error: any) {
    console.error('Error bulk updating boutiques:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update boutiques' },
      { status: error.statusCode || 500 }
    );
  }
}
