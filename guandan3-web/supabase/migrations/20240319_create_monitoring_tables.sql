-- 性能指标表
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  fcp FLOAT,
  lcp FLOAT,
  fid FLOAT,
  cls FLOAT,
  ttfb FLOAT,
  load_time FLOAT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 错误日志表
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component TEXT,
  page TEXT,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  additional_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 分析事件表
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  page TEXT,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  properties JSONB,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_page ON performance_metrics(page);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);

-- 启用行级安全性
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- 允许服务角色插入数据
CREATE POLICY "Allow service role to insert performance metrics"
  ON performance_metrics
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service role to insert error logs"
  ON error_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service role to insert analytics events"
  ON analytics_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 允许服务角色读取数据
CREATE POLICY "Allow service role to read performance metrics"
  ON performance_metrics
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Allow service role to read error logs"
  ON error_logs
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Allow service role to read analytics events"
  ON analytics_events
  FOR SELECT
  TO service_role
  USING (true);

-- 创建清理旧数据的函数
CREATE OR REPLACE FUNCTION cleanup_old_monitoring_data()
RETURNS void AS $$
BEGIN
  -- 删除30天前的性能指标
  DELETE FROM performance_metrics
  WHERE timestamp < NOW() - INTERVAL '30 days';

  -- 删除90天前的错误日志
  DELETE FROM error_logs
  WHERE timestamp < NOW() - INTERVAL '90 days';

  -- 删除90天前的分析事件
  DELETE FROM analytics_events
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 创建定时任务清理旧数据（需要pg_cron扩展）
-- SELECT cron.schedule('cleanup-monitoring-data', '0 2 * * *', 'SELECT cleanup_old_monitoring_data()');
