import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import mongoose from 'mongoose'
import { ObjectId } from 'mongodb'

// POST - Submit new reporter application (Public - no auth required)
export async function POST(request) {
    try {
        const body = await request.json()
        const { fullName, phone, email, experience, portfolio, reason } = body

        // Validate required fields
        if (!fullName || !phone || !email) {
            return NextResponse.json({ error: 'Name, phone, and email are required' }, { status: 400 })
        }

        await connectDB()
        const db = mongoose.connection.db

        // Check for duplicate email
        const existing = await db.collection('reporter_applications').findOne({ email: email.toLowerCase() })
        if (existing) {
            return NextResponse.json({ error: 'An application with this email already exists' }, { status: 400 })
        }

        // Create application record
        const application = {
            id: new ObjectId().toString(),
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.toLowerCase().trim(),
            experience: experience?.trim() || '',
            portfolio: portfolio?.trim() || '',
            reason: reason?.trim() || '',
            status: 'PENDING', // PENDING | CONTACTED | REJECTED
            adminNote: '',
            submittedAt: new Date(),
            updatedAt: new Date()
        }

        await db.collection('reporter_applications').insertOne(application)

        return NextResponse.json({
            success: true,
            message: 'Application submitted successfully',
            id: application.id
        })
    } catch (error) {
        console.error('Reporter application POST error:', error)
        return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
    }
}

// GET - Fetch all reporter applications (Admin only)
export async function GET(request) {
    try {
        // Check admin auth
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()
        const db = mongoose.connection.db

        const applications = await db.collection('reporter_applications')
            .find({})
            .sort({ submittedAt: -1 })
            .toArray()

        return NextResponse.json({ applications })
    } catch (error) {
        console.error('Reporter applications GET error:', error)
        return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
    }
}

// PUT - Update application status (Admin only)
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

        if (!['PENDING', 'CONTACTED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        await connectDB()
        const db = mongoose.connection.db

        const result = await db.collection('reporter_applications').updateOne(
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
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, message: 'Application updated' })
    } catch (error) {
        console.error('Reporter application PUT error:', error)
        return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
    }
}

// DELETE - Delete application (Admin only)
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

        await db.collection('reporter_applications').deleteOne({ id: id })

        return NextResponse.json({ success: true, message: 'Application deleted' })
    } catch (error) {
        console.error('Reporter application DELETE error:', error)
        return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
    }
}

