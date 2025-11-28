import { NextResponse } from 'next/server';
import { requireBusiness } from '@/lib/auth-business';
import { getBusinessAccountByOwner, updateBusinessAccount } from '@/services/businessAccountService';

export async function GET() {
  try {
    const { user, businessAccount } = await requireBusiness({ redirect: false });
    return NextResponse.json(businessAccount);
  } catch (error: any) {
    console.error('Error fetching business profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch business profile' },
      { status: error.statusCode || 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { user, businessAccount } = await requireBusiness({ redirect: false });
    const updates = await request.json();

    // Only allow updating certain fields
    const allowedUpdates = {
      businessName: updates.businessName,
      contactPersonName: updates.contactPersonName,
      contactEmail: updates.contactEmail,
      businessAddress: updates.businessAddress,
      businessPhone: updates.businessPhone,
      taxId: updates.taxId,
      website: updates.website,
      description: updates.description,
      shippingPolicies: updates.shippingPolicies,
      returnPolicy: updates.returnPolicy,
    };

    const updatedBusiness = await updateBusinessAccount(businessAccount.id, allowedUpdates);

    if (!updatedBusiness) {
      return NextResponse.json(
        { error: 'Failed to update business profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedBusiness);
  } catch (error: any) {
    console.error('Error updating business profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update business profile' },
      { status: error.statusCode || 500 }
    );
  }
}
