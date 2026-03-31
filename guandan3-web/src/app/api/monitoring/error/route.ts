import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { logger } from '@/lib/utils/logger'
export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('error_logs')
      .insert({
        error_type: errorData.errorType,
        error_message: errorData.errorMessage,
        error_stack: errorData.errorStack,
        component: errorData.component,
        page: errorData.page,
        user_id: errorData.userId,
        timestamp: new Date(errorData.timestamp).toISOString(),
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        additional_info: errorData.additionalInfo
      })
      .select()

    if (error) {
      logger.error('Failed to log error:', error)
      return NextResponse.json(
        { error: 'Failed to log error' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    logger.error('Error logging error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const errorType = searchParams.get('errorType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
      .from('error_logs')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (errorType) {
      query = query.eq('error_type', errorType)
    }

    if (startDate) {
      query = query.gte('timestamp', new Date(startDate).toISOString())
    }

    if (endDate) {
      query = query.lte('timestamp', new Date(endDate).toISOString())
    }

    const { data, error, count } = await query

    if (error) {
      logger.error('Failed to fetch error logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch error logs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data,
      count,
      limit,
      offset
    })
  } catch (error) {
    logger.error('Error fetching error logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
