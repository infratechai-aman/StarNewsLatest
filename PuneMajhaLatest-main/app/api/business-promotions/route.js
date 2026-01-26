import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import mongoose from 'mongoose'
import { ObjectId } from 'mongodb'

// POST - Submit new business promotion request (Public - no auth required)
export async function POST(request) {
    try {
        const body = await request.json()
        const { businessName, ownerName, phone, email, address, description } = body

        // Validate required fields
        if (!businessName || !ownerName || !phone || !email || !address) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        await connectDB()
        const db = mongoose.connection.db

        // Create application record
        const promotion = {
            id: new ObjectId().toString(),
            businessName: businessName.trim(),
            ownerName: ownerName.trim(),
            phone: phone.trim(),
            email: email.toLowerCase().trim(),
            address: address.trim(),
            description: description?.trim() || '',
            status: 'PENDING', // PENDING | APPROVED | REJECTED | CONTACTED
            adminNote: '',
            submittedAt: new Date(),
            updatedAt: new Date()
        }

        await db.collection('business_promotions').insertOne(promotion)

        return NextResponse.json({
            success: true,
            message: 'Promotion request submitted successfully',
            id: promotion.id
        })
    } catch (error) {
        console.error('Business promotion POST error:', error)
        return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
    }
}

// GET - Fetch all business promotion requests (Admin only)
export async function GET(request) {
    try {
        // Check admin auth
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()
        const db = mongoose.connection.db

        const promotions = await db.collection('business_promotions')
            .find({})
            .sort({ submittedAt: -1 })
            .toArray()

        return NextResponse.json({ promotions })
    } catch (error) {
        console.error('Business promotion GET error:', error)
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }
}

// PUT - Update request status (Admin only)
export async function PUT(request) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, status, adminNote } = body

        if (!id || !status) {
            return NextResponse.json({ error: 'ID and status are required' }, { status: 400 })
        }

        await connectDB()
        const db = mongoose.connection.db

        const result = await db.collection('business_promotions').updateOne(
            { id: id },
            {
                $set: {
                    status,
                    adminNote: adminNote || '',
                    updatedAt: new Date()
                }
            }
        )

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, message: 'Request updated' })
    } catch (error) {
        console.error('Business promotion PUT error:', error)
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }
}

// DELETE - Delete request (Admin only)
export async function DELETE(request) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        await connectDB()
        const db = mongoose.connection.db

        await db.collection('business_promotions').deleteOne({ id: id })

        return NextResponse.json({ success: true, message: 'Request deleted' })
    } catch (error) {
        console.error('Business promotion DELETE error:', error)
        return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 })
    }
}
