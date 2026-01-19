(function () {
    const scripts = document.getElementsByTagName('script');
    const myUrl = scripts[scripts.length - 1].src;
    const settingsUrl = myUrl.substring(0, myUrl.lastIndexOf('/')) + '/settings.html';

    // ============================
    // 1. 排版处理
    // ============================
    function htmlToPerfectText(htmlContent) {
        if (!htmlContent) return "";
        let processed = htmlContent.replace(/<think>[\s\S]*?<\/think>/gi, "");
        processed = processed.replace(/<br\s*\/?>/gi, "\r\n");
        processed = processed.replace(/<\/p>/gi, "\r\n\r\n");
        processed = processed.replace(/<\/div>/gi, "\r\n");
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = processed;
        let finalString = tempDiv.textContent || tempDiv.innerText;
        finalString = finalString.replace(/(\r\n){3,}/g, "\r\n\r\n");
        return finalString.trim();
    }

    // ============================
    // 2. 导出逻辑
    // ============================
    function getExportContent() {
        const incAI = localStorage.getItem('lw_inc_ai') !== 'false';
        const incUser = localStorage.getItem('lw_inc_user') === 'true';
        if (!incAI && !incUser) { toastr.error("两个都不导，导空气吗？💨"); return null; }

        let content = [];
        let count = 0;
        $('.mes').each(function() {
            const msgDiv = $(this);
            const isUser = msgDiv.attr('is_user') === 'true';
            if (isUser && !incUser) return;
            if (!isUser && !incAI) return;
            const textDiv = msgDiv.find('.mes_text');
            if (textDiv.length === 0) return;
            const clone = textDiv.clone();
            clone.find('.lw-btn-group').remove();
            const cleanText = htmlToPerfectText(clone.html());
            if (!cleanText) return;
            content.push(cleanText);
            count++;
        });

        if (count === 0) { toastr.warning("无内容"); return null; }
        return content.join('\r\n\r\n\r\n');
    }

    function downloadExport() {
        const text = getExportContent();
        if (!text) return;
        const context = SillyTavern.getContext();
        let charName = "Chat";
        if (context.characterId && context.characters[context.characterId]) charName = context.characters[context.characterId].name;
        const filename = `${charName}_${Date.now()}.txt`;
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        toastr.info("导出成功");
    }

    // ============================
    // 3. 动画控制 (解决粘连的核心)
    // ============================
    function flashButton(btn) {
        // 1. 强制失去焦点，立刻清除浏览器默认的灰框
        btn.blur(); 
        
        // 2. 添加我们自己定义的“闪烁”样式 (灰色背景)
        btn.addClass('lw-flash-active');
        
        // 3. 设定定时器：0.5秒后自动移除背景
        // 这样不管你点不点其他地方，它自己都会灭掉
        setTimeout(() => {
            btn.removeClass('lw-flash-active');
        }, 500); // 500ms = 0.5秒，视觉上最舒适
    }

    $(document).on('click', '.lw-btn-copy', function(e) {
        e.stopPropagation();
        const btn = $(this);
        
        flashButton(btn); // 触发闪烁

        const bubble = btn.closest('.mes_text');
        const clone = bubble.clone();
        clone.find('.lw-btn-group').remove();
        const cleanText = htmlToPerfectText(clone.html());

        navigator.clipboard.writeText(cleanText).then(() => toastr.success('已复制'));
    });

    $(document).on('click', '.lw-btn-export', function(e) {
        e.stopPropagation();
        const btn = $(this);
        
        flashButton(btn); // 触发闪烁
        
        downloadExport();
    });

    // ============================
    // 4. 注入器
    // ============================
    setInterval(() => {
        const showCopy = localStorage.getItem('lw_show_copy_btn') !== 'false';
        const showExport = localStorage.getItem('lw_show_export_btn') !== 'false';

        $('.mes_text').each(function() {
            const el = $(this);
            let group = el.find('.lw-btn-group');
            if ((showCopy || showExport) && group.length === 0) {
                el.addClass('lw-padded-msg');
                group = $('<div class="lw-btn-group"></div>');
                el.append(group);
            }
            const hasExport = group.find('.lw-btn-export').length > 0;
            if (showExport && !hasExport) group.append(`<div class="lw-action-btn lw-btn-export" title="导出"><i class="fa-solid fa-file-arrow-down"></i></div>`);
            else if (!showExport && hasExport) group.find('.lw-btn-export').remove();

            const hasCopy = group.find('.lw-btn-copy').length > 0;
            if (showCopy && !hasCopy) group.append(`<div class="lw-action-btn lw-btn-copy" title="复制"><i class="fa-regular fa-copy"></i></div>`);
            else if (!showCopy && hasCopy) group.find('.lw-btn-copy').remove();

            if (!showCopy && !showExport && group.length > 0) {
                group.remove();
                el.removeClass('lw-padded-msg');
            }
        });
    }, 1000);

    // ============================
    // 5. 设置加载
    // ============================
    function loadSettings() {
        $.get(settingsUrl, function(data) {
            $("#extensions_settings").append(data);
            $('#lw_show_copy_btn').prop('checked', localStorage.getItem('lw_show_copy_btn') !== 'false');
            $('#lw_show_export_btn').prop('checked', localStorage.getItem('lw_show_export_btn') !== 'false');
            $('#lw_inc_ai').prop('checked', localStorage.getItem('lw_inc_ai') !== 'false');
            $('#lw_inc_user').prop('checked', localStorage.getItem('lw_inc_user') === 'true');

            $('#lw_show_copy_btn').on('change', function() { localStorage.setItem('lw_show_copy_btn', $(this).prop('checked')); });
            $('#lw_show_export_btn').on('change', function() { localStorage.setItem('lw_show_export_btn', $(this).prop('checked')); });
            $('#lw_inc_ai').on('change', function() { localStorage.setItem('lw_inc_ai', $(this).prop('checked')); });
            $('#lw_inc_user').on('change', function() { localStorage.setItem('lw_inc_user', $(this).prop('checked')); });
        });
    }

    $(document).ready(() => loadSettings());
})();
