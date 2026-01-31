import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import News from '@/models/News'
import { headers } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function GET() {
    try {
        const headersList = headers()
        const token = headersList.get('authorization')?.split(' ')[1]

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (!decoded || decoded.role !== 'reporter') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()
        const articles = await News.find({ authorEmail: decoded.email }).sort({ createdAt: -1 })

        return NextResponse.json({ articles })
    } catch (error) {
        console.error('My Articles Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
