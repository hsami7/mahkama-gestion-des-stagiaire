import React, { useState, useEffect, useRef } from 'react';
import { PaperPlaneTilt, Paperclip, Trash, FileText, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { api } from '../services/api';

interface Message {
  id: number;
  intern_id: number;
  sender_role: 'admin' | 'intern';
  sender_name: string | null;
  body: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_url: string | null;
  waiting_for_reply: boolean;
  expected_format: string | null;
  replied: boolean;
  created_at: string;
}

const FORMAT_LABEL: Record<string, string> = {
  text: 'نص',
  pdf: 'PDF',
  word: 'Word',
  any: 'أي صيغة'
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function Messaging({ internId, mode }: { internId: number; mode: 'admin' | 'intern' }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [expectedFormat, setExpectedFormat] = useState('any');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAdmin = mode === 'admin';

  const fetchMessages = async () => {
    try {
      const data = await api.getMessages(internId);
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages().then(() => scrollToBottom());
    const interval = setInterval(fetchMessages, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    // Only scroll to bottom once when the conversation view opens, not on every poll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!body.trim() && !file) return;
    setSending(true);
    const formData = new FormData();
    formData.append('body', body);
    if (file) formData.append('file', file);
    if (isAdmin) {
      formData.append('waiting_for_reply', waiting ? 'true' : 'false');
      formData.append('expected_format', expectedFormat);
    }
    try {
      await api.sendMessage(internId, formData);
      setBody('');
      setFile(null);
      setWaiting(false);
      setExpectedFormat('any');
      fetchMessages().then(() => scrollToBottom());
    } catch (err: any) {
      alert(err?.message || 'حدث خطأ أثناء الإرسال');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msg: Message) => {
    if (!isAdmin) return;
    try {
      await api.deleteMessage(internId, msg.id);
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const pendingReply = messages.filter(m => m.waiting_for_reply && !m.replied).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="section-title" style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>المراسلات</h3>
        {isAdmin && pendingReply > 0 && (
          <span style={{ fontSize: 12, background: 'var(--warning-bg)', color: 'var(--warning)', padding: '4px 10px', borderRadius: 20, fontWeight: 700 }}>
            {pendingReply} بانتظار رد
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '4px 2px', minHeight: 200, maxHeight: 460 }}>
        {loading && <div style={{ color: 'var(--slate)', fontSize: 13 }}>جاري التحميل...</div>}
        {!loading && messages.length === 0 && (
          <div style={{ color: 'var(--slate)', fontSize: 13, textAlign: 'center', padding: '30px 0' }}>لا توجد رسائل بعد</div>
        )}
        {messages.map(m => {
          const mine = (isAdmin && m.sender_role === 'admin') || (!isAdmin && m.sender_role === 'intern');
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-start' : 'flex-end' }}>
              <div style={{
                background: mine ? 'var(--success-bg)' : 'var(--paper)',
                border: `1px solid ${mine ? 'var(--success-border)' : 'var(--line)'}`,
                borderRadius: 12, padding: '10px 14px', maxWidth: '85%', direction: 'rtl', textAlign: 'right'
              }}>
                {m.body && <div style={{ fontSize: 13.5, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{m.body}</div>}
                {m.attachment_url && (
                  <a href={m.attachment_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12.5, color: 'var(--gold-dark)', textDecoration: 'none' }}>
                    <FileText size={16} /> {m.attachment_name || 'مرفق'}
                  </a>
                )}
                {m.waiting_for_reply && !m.replied && isAdmin && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <WarningCircle size={15} /> بانتظار رد{m.expected_format ? ` (${FORMAT_LABEL[m.expected_format] || m.expected_format})` : ''}
                  </div>
                )}
                {m.waiting_for_reply && m.replied && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CheckCircle size={15} /> تم الرد
                  </div>
                )}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--slate-light)', marginTop: 4, paddingInline: 4 }}>
                {m.sender_name || (m.sender_role === 'admin' ? 'الإدارة' : 'المتدرب')} · {formatTime(m.created_at)}
                {isAdmin && (
                  <button onClick={() => handleDelete(m)} title="حذف" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginInlineStart: 8, padding: 0 }}>
                    <Trash size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 8 }}>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--slate)', cursor: 'pointer' }}>
              <input type="checkbox" checked={waiting} onChange={e => setWaiting(e.target.checked)} />
              بانتظار رد من المتدرب؟
            </label>
            {waiting && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--slate)' }}>
                الصيغة المتوقعة:
                <select value={expectedFormat} onChange={e => setExpectedFormat(e.target.value)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--line)' }}>
                  <option value="any">أي صيغة</option>
                  <option value="text">نص</option>
                  <option value="pdf">PDF</option>
                  <option value="word">Word</option>
                </select>
              </label>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            className="input"
            rows={2}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={waiting ? 'اكتب رسالتك وحدد ما تنتظره من المتدرب...' : 'اكتب رسالتك...'}
            style={{ flex: 1, resize: 'vertical', fontFamily: 'inherit' }}
          />
          <label title="إرفاق ملف" style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--paper)', border: '1px solid var(--line)', color: 'var(--slate)' }}>
            <Paperclip size={18} />
            <input type="file" style={{ display: 'none' }} onChange={e => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
          </label>
          <button className="btn btn-ink" onClick={handleSend} disabled={sending || (!body.trim() && !file)} style={{ height: 40, padding: '0 16px' }}>
            <PaperPlaneTilt size={18} /> {sending ? '...' : 'إرسال'}
          </button>
        </div>
        {file && (
          <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={14} /> {file.name}
            <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
}
