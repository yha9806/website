/**
 * Supabase Client Configuration
 *
 * 用于前端直接访问 Supabase 数据库（仅限公开操作）
 * - Newsletter 订阅
 * - 联系表单提交
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 检查配置是否存在
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Some features may not work.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Newsletter 订阅
 */
export async function subscribeNewsletter(email: string, source: string = 'footer') {
  if (!supabase) {
    console.error('Supabase not configured');
    return { success: false, error: 'Service unavailable' };
  }

  try {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: email.toLowerCase().trim(),
        source,
        subscribed_at: new Date().toISOString()
      });

    if (error) {
      // 处理重复邮箱
      if (error.code === '23505') {
        return { success: true, error: null, message: 'Already subscribed' };
      }
      console.error('Newsletter subscription error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Newsletter subscription failed:', err);
    return { success: false, error: 'Network error' };
  }
}

/**
 * 联系表单提交
 */
export async function submitContactForm(data: {
  name: string;
  email: string;
  company?: string;
  message: string;
  source?: string;
}) {
  if (!supabase) {
    console.error('Supabase not configured');
    return { success: false, error: 'Service unavailable' };
  }

  try {
    const { error } = await supabase
      .from('contact_submissions')
      .insert({
        ...data,
        email: data.email.toLowerCase().trim(),
        submitted_at: new Date().toISOString()
      });

    if (error) {
      console.error('Contact form error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Contact form failed:', err);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Demo 请求提交
 */
export async function submitDemoRequest(data: {
  name: string;
  email: string;
  company: string;
  role?: string;
  useCase?: string;
  message?: string;
}) {
  if (!supabase) {
    console.error('Supabase not configured');
    return { success: false, error: 'Service unavailable' };
  }

  try {
    const { error } = await supabase
      .from('demo_requests')
      .insert({
        ...data,
        email: data.email.toLowerCase().trim(),
        submitted_at: new Date().toISOString(),
        status: 'pending'
      });

    if (error) {
      console.error('Demo request error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Demo request failed:', err);
    return { success: false, error: 'Network error' };
  }
}
