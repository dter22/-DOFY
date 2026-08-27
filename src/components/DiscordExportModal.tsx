import React, { useState } from 'react';
import { RuleCategory } from '../types';
import { X, FileText, Copy, Check, Share2, Download, Printer } from 'lucide-react';

interface DiscordExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: RuleCategory[];
}

export const DiscordExportModal: React.FC<DiscordExportModalProps> = ({
  isOpen,
  onClose,
  categories,
}) => {
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<'discord' | 'json' | 'text'>('discord');

  if (!isOpen) return null;

  const generateDiscordMarkdown = () => {
    let out = `## 📋 ┃ لائحة قوانين وعقوبات السيرفر الرسمية\n`;
    out += `> تم تحديث اللائحة وتطبيقها على جميع اللاعبين بدون استثناء.\n\n`;

    categories.forEach((cat, cIdx) => {
      out += `### 🟧 **${cIdx + 1}. ${cat.title}**\n`;
      out += `*${cat.subtitle || 'قواعد وضوابط اللعب'}*\n\n`;
      
      out += `**⚠️ قائمة المخالفات:**\n`;
      cat.violations.forEach((v, vIdx) => {
        out += `• **${v.name}** ${v.englishTerm ? `\`[${v.englishTerm}]\`` : ''}${v.description ? ` - ${v.description}` : ''}\n`;
      });
      out += `\n`;

      out += `**⚖️ تدرج العقوبات:**\n`;
      cat.punishments.forEach((p) => {
        out += `> ▫️ **${p.times}:** \`${p.penalty}\`\n`;
      });
      out += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    });

    out += `\n**📌 ملاحظات هامة:**\n- يتم تسجيل جميع العقوبات في تذاكر الدعم وسجل الباندات.\n- يحق للإدارة تغليظ العقوبة في حال تكرار التخريب المتعمد.\n`;
    return out;
  };

  const generateJSON = () => {
    return JSON.stringify(categories, null, 2);
  };

  const generatePlainText = () => {
    let out = `=== جدول قوانين وباندات السيرفر ===\n\n`;
    categories.forEach((cat, idx) => {
      out += `[${idx + 1}] ${cat.title}\n`;
      out += `المخالفات:\n`;
      cat.violations.forEach((v) => out += `  - ${v.name}\n`);
      out += `العقوبات:\n`;
      cat.punishments.forEach((p) => out += `  * ${p.times}: ${p.penalty}\n`);
      out += `------------------------------------\n\n`;
    });
    return out;
  };

  const getContent = () => {
    if (exportFormat === 'json') return generateJSON();
    if (exportFormat === 'text') return generatePlainText();
    return generateDiscordMarkdown();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = exportFormat === 'json' ? 'json' : exportFormat === 'discord' ? 'md' : 'txt';
    const blob = new Blob([getContent()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `server_rules_matrix.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#111118] border-2 border-orange-500/40 rounded-2xl shadow-[0_0_50px_rgba(249,115,22,0.25)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white font-['Cairo']">
                تصدير جدول القوانين والباندات
              </h3>
              <p className="text-xs text-zinc-400">
                نسخ بصيغة Discord Markdown جاهزة للنشر في قنوات الديسكورد
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1a1a24] hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 flex-1 flex flex-col overflow-hidden">
          
          {/* Format selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExportFormat('discord')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  exportFormat === 'discord'
                    ? 'bg-orange-500 text-black shadow-md'
                    : 'bg-[#181824] text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                تنسيق ديسكورد (Markdown)
              </button>
              <button
                onClick={() => setExportFormat('text')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  exportFormat === 'text'
                    ? 'bg-orange-500 text-black shadow-md'
                    : 'bg-[#181824] text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                نص عادي (Text)
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  exportFormat === 'json'
                    ? 'bg-orange-500 text-black shadow-md'
                    : 'bg-[#181824] text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                بيانات برمجية (JSON)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg bg-[#181824] hover:bg-[#222234] border border-zinc-700 text-zinc-300 hover:text-white text-xs transition cursor-pointer flex items-center gap-1"
                title="تحميل ملف"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">تحميل</span>
              </button>
            </div>
          </div>

          {/* Preview Box */}
          <div className="flex-1 bg-[#0b0b10] border border-zinc-800 rounded-xl p-4 overflow-y-auto font-mono text-xs text-zinc-300 leading-relaxed select-all" dir="ltr">
            <pre className="whitespace-pre-wrap">{getContent()}</pre>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-[#0c0c12] flex items-center justify-between">
          <span className="text-xs text-zinc-400">
            جاهز للصق مباشرة في روم <span className="text-orange-400 font-mono">#قوانين-السيرفر</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={handleCopy}
              className="px-6 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition shadow-[0_0_15px_rgba(249,115,22,0.4)] cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم النسخ بنجاح!' : 'نسخ النص بالكامل'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
