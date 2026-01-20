(function () {
    const scripts = document.getElementsByTagName('script');
    const myUrl = scripts[scripts.length - 1].src;
    const settingsUrl = myUrl.substring(0, myUrl.lastIndexOf('/')) + '/settings.html';

    function ultimateClean(html) {
        if (!html) return "";
        let s = html;
        const junkKillers = [
            /<!DOCTYPE[\s\S]*/gi,
            /<div id="refine"[\s\S]*/gi,
            /<script[\s\S]*?<\/script>/gi,
            /<refine>[\s\S]*?<\/refine>/gi,
            /<think>[\s\S]*?<\/think>/gi
        ];
        junkKillers.forEach(reg => { s = s.replace(reg, ""); });
        const temp = document.createElement('div');
        temp.innerHTML = s;
        $(temp).find('#refine, script, style, .lw-btn-group, .st-assistant-container').remove();
        $(temp).find('br').replaceWith('\n');
        $(temp).find('p, div').append('\n');
        let text = temp.innerText || temp.textContent || "";
        text = text.replace(/\[\s*\{\s*"original"[\s\S]*?\}\s*\]/g, "");
        text = text.replace(/\{\s*"original"[\s\S]*?"corrected"[\s\S]*?\}/g, "");
        text = text.replace(/显示前端代码块[\s\S]*/g, "");
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

    // --- 核心修复：定时检查设置，多退少补 ---
    setInterval(() => {
        const showCopy = localStorage.getItem('lw_show_copy_btn') !== 'false';
        const showExport = localStorage.getItem('lw_show_export_btn') !== 'false';

        $('.mes_text').each(function() {
            const el = $(this);
            let group = el.find('.lw-btn-group');

            // 1. 如果开关全关，彻底删除组并移除边距
            if (!showCopy && !showExport) {
                if (group.length > 0) {
                    group.remove();
                    el.removeClass('lw-padded-msg');
                }
                return;
            }

            // 2. 如果开关开启但组不存在，创建组
            if (group.length === 0) {
                el.addClass('lw-padded-msg');
                group = $('<div class="lw-btn-group"></div>').appendTo(el);
            }

            // 3. 处理导出按钮 (多退少补)
            const exportBtn = group.find('.lw-btn-export');
            if (showExport && exportBtn.length === 0) {
                group.append('<div class="lw-action-btn lw-btn-export" title="导出"><i class="fa-solid fa-file-arrow-down"></i></div>');
            } else if (!showExport && exportBtn.length > 0) {
                exportBtn.remove();
            }

            // 4. 处理复制按钮 (多退少补)
            const copyBtn = group.find('.lw-btn-copy');
            if (showCopy && copyBtn.length === 0) {
                group.append('<div class="lw-action-btn lw-btn-copy" title="复制"><i class="fa-regular fa-copy"></i></div>');
            } else if (!showCopy && copyBtn.length > 0) {
                copyBtn.remove();
            }
        });
    }, 1000);

    function loadSettings() {
        $.get(settingsUrl, function(data) {
            $("#extensions_settings").append(data);
            $('#lw_show_copy_btn').prop('checked', localStorage.getItem('lw_show_copy_btn') !== 'false');
            $('#lw_show_export_btn').prop('checked', localStorage.getItem('lw_show_export_btn') !== 'false');
            $('#lw_inc_ai').prop('checked', localStorage.getItem('lw_inc_ai') !== 'false');
            $('#lw_inc_user').prop('checked', localStorage.getItem('lw_inc_user') === 'true');
            $('#lw_show_copy_btn, #lw_show_export_btn, #lw_inc_ai, #lw_inc_user').on('change', function() {
                localStorage.setItem(this.id, $(this).prop('checked'));
            });
        });
    }
    $(document).ready(() => loadSettings());
})();

