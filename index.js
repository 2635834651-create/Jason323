(function () {
    const scripts = document.getElementsByTagName('script');
    const myUrl = scripts[scripts.length - 1].src;
    const settingsUrl = myUrl.substring(0, myUrl.lastIndexOf('/')) + '/settings.html';
    function ultimateClean(html) {
        if (!html) return "";
        const incMenu = localStorage.getItem('lw_inc_menu') === 'true';
        let s = html;
        const killers = [
            /<think>[\s\S]*?<\/think>/gi,
            /<think>[\s\S]*?<\/think>/gi,
            /<状态栏>[\s\S]*?<\/状态栏>/gi,  // ★ 新增：HTML转义版思维链
            /<状态栏>[\s\S]*?<\/状态栏>/gi,              // ★ 新增：原始标签版思维链
            /<!DOCTYPE[\s\S]*/gi,
            /<div id="refine"[\s\S]*/gi,
            /<script[\s\S]*?<\/script>/gi,
            /<refine>[\s\S]*?<\/refine>/gi
        ];
        killers.forEach(reg => { s = s.replace(reg, ""); });
        // 【第一道闸门：HTML 级物理斩断】
        if (!incMenu) {
            s = s.replace(/<div class="st-holo-wrapper[\s\S]*/i, "");
        }
        const temp = document.createElement('div');
        temp.innerHTML = s;
        if (!incMenu) {
            $(temp).find('.no-copy, .ignore-copy, .exclude-copy, .st-holo-wrapper').remove();
            const menuKeys = ['Master', '事件记录', '任务指引', '任务中心', '( =ω=)', '★', '⭐', '♪', '当前任务'];
            $(temp).find('div, section, blockquote, a, span, button, table').each(function() {
                const text = $(this).text();
                if (menuKeys.some(key => text.includes(key))) {
                    $(this).remove();
                }
            });
        }
        $(temp).find('#refine, script, style, .lw-btn-group, .st-assistant-container, .sta-container').remove();
        $(temp).find('br').replaceWith('\n');
        $(temp).find('p, div').append('\n');
        let text = temp.innerText || temp.textContent || "";
        text = text.replace(/\[\s*\{\s*"original"[\s\S]*?\}\s*\]/g, "");
        text = text.replace(/\{\s*"original"[\s\S]*?"corrected"[\s\S]*?\}/g, "");
        text = text.replace(/显示前端代码块[\s\S]*/g, "");
        // 【第二道闸门：纯文本级终极绞杀】
        if (!incMenu) {
            text = text.replace(/💠[\s\S]*/g, "");                         // ★ 修改：只要出现💠就从此处截断到底
            text = text.replace(/【状态面板】[\s\S]*/g, "");
            text = text.replace(/\[思维链[\s\S]*/g, "");                   // ★ 新增：兜底清理残留思维链文字
            text = text.replace(/<\/?状态栏>/g, "");                       // ★ 新增：兜底清理残留标签
        }
        return text.replace(/\n{3,}/g, "\n\n").trim();
    }
    function handleAction() {
        const incAI = localStorage.getItem('lw_inc_ai') !== 'false';
        const incUser = localStorage.getItem('lw_inc_user') === 'true';
        if (!incAI && !incUser) { toastr.error("导空气吗？💨"); return null; }
        let results = [];
        $('.mes').each(function() {
            const m = $(this);
            const isUser = m.attr('is_user') === 'true';
            if ((isUser && incUser) || (!isUser && incAI)) {
                const clean = ultimateClean(m.find('.mes_text').html());
                if (clean) results.push(clean);
            }
        });
        return results.join('\n\n\n');
    }
    $(document).on('click', '.lw-btn-copy', function(e) {
        e.stopPropagation();
        const btn = $(this);
        btn.addClass('lw-flash-active');
        setTimeout(() => btn.removeClass('lw-flash-active'), 400);
        const pure = ultimateClean(btn.closest('.mes_text').html());
        if (!pure) return toastr.warning("正文为空");
        navigator.clipboard.writeText(pure).then(() => toastr.success('已复制'));
    });
    $(document).on('click', '.lw-btn-export', function(e) {
        e.stopPropagation();
        const btn = $(this);
        btn.addClass('lw-flash-active');
        setTimeout(() => btn.removeClass('lw-flash-active'), 400);
        const text = handleAction();
        if (!text) return;
        const context = SillyTavern.getContext();
        const charName = (context.characterId && context.characters[context.characterId]) ? context.characters[context.characterId].name : "Chat";
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${charName}_${Date.now()}.txt`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        toastr.success("已导出");
    });
    setInterval(() => {
        const showCopy = localStorage.getItem('lw_show_copy_btn') !== 'false';
        const showExport = localStorage.getItem('lw_show_export_btn') !== 'false';
        $('.mes_text').each(function() {
            const el = $(this);
            let group = el.find('.lw-btn-group');
            if (!showCopy && !showExport) {
                if (group.length > 0) { group.remove(); el.removeClass('lw-padded-msg'); }
                return;
            }
            if (group.length === 0) {
                el.addClass('lw-padded-msg');
                group = $('<div class="lw-btn-group"></div>').appendTo(el);
            }
            const exportBtn = group.find('.lw-btn-export');
            if (showExport && exportBtn.length === 0) {
                group.append('<div class="lw-action-btn lw-btn-export" title="导出"><i class="fa-solid fa-file-arrow-down"></i></div>');
            } else if (!showExport && exportBtn.length > 0) { exportBtn.remove(); }
            const copyBtn = group.find('.lw-btn-copy');
            if (showCopy && copyBtn.length === 0) {
                group.append('<div class="lw-action-btn lw-btn-copy" title="复制"><i class="fa-regular fa-copy"></i></div>');
            } else if (!showCopy && copyBtn.length > 0) { copyBtn.remove(); }
        });
    }, 1000);
    function loadSettings() {
        $.get(settingsUrl, function(data) {
            $("#extensions_settings").append(data);
            $('#lw_show_copy_btn').prop('checked', localStorage.getItem('lw_show_copy_btn') !== 'false');
            $('#lw_show_export_btn').prop('checked', localStorage.getItem('lw_show_export_btn') !== 'false');
            $('#lw_inc_ai').prop('checked', localStorage.getItem('lw_inc_ai') !== 'false');
            $('#lw_inc_user').prop('checked', localStorage.getItem('lw_inc_user') === 'true');
            $('#lw_inc_menu').prop('checked', localStorage.getItem('lw_inc_menu') === 'true');
            $('#lw_show_copy_btn, #lw_show_export_btn, #lw_inc_ai, #lw_inc_user, #lw_inc_menu').on('change', function() {
                localStorage.setItem(this.id, $(this).prop('checked'));
            });
        });
    }
    $(document).ready(() => loadSettings());
})();
