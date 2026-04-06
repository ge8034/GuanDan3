import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 使用RPC执行SQL（如果配置了RPC）
    // 或者直接使用SQL执行

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE games ADD COLUMN IF NOT EXISTS paused_by uuid;
        ALTER TABLE games ADD COLUMN IF NOT EXISTS paused_at timestamptz;
        ALTER TABLE games ADD COLUMN IF NOT EXISTS pause_reason text;
      `
    });

    if (error) {
      console.error('SQL执行错误:', error);
      // 如果RPC不可用，尝试直接查询来验证列是否存在
      const { data: gamesData, error: queryError } = await supabase
        .from('games')
        .select('paused_by, paused_at, pause_reason')
        .limit(1);

      if (queryError && queryError.message.includes('does not exist')) {
        // 列确实不存在，需要手动执行
        return NextResponse.json({
          success: false,
          error: '需要手动在Supabase SQL Editor中执行SQL',
          sql: `
ALTER TABLE games ADD COLUMN IF NOT EXISTS paused_by uuid;
ALTER TABLE games ADD COLUMN IF NOT EXISTS paused_at timestamptz;
ALTER TABLE games ADD COLUMN IF NOT EXISTS pause_reason text;
          `
        }, { status: 400 });
      }

      // 如果查询成功，说明列已经存在或者添加成功
      return NextResponse.json({
        success: true,
        message: '列已存在或添加成功',
        existing: !!gamesData
      });
    }

    return NextResponse.json({
      success: true,
      message: 'SQL执行成功',
      data
    });

  } catch (error: any) {
    console.error('API错误:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      hint: '请在Supabase SQL Editor中手动执行以下SQL:\n\n' +
        'ALTER TABLE games ADD COLUMN IF NOT EXISTS paused_by uuid;\n' +
        'ALTER TABLE games ADD COLUMN IF NOT EXISTS paused_at timestamptz;\n' +
        'ALTER TABLE games ADD COLUMN IF NOT EXISTS pause_reason text;'
    }, { status: 500 });
  }
}