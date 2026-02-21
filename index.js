    function ultimateClean(html) {
        if (!html) return "";
        const incMenu = localStorage.getItem('lw_inc_menu') === 'true'; 
        let s = html;

        const killers = [
            /&lt;think&gt;[\s\S]*?&lt;\/think&gt;/gi, 
            /<think>[\s\S]*?<\/think>/gi,          
            /<!DOCTYPE[\s\S]*/gi,
            /<div id="refine"[\s\S]*/gi,
            /<script[\s\S]*?<\/script>/gi,
            /<refine>[\s\S]*?<\/refine>/gi
        ];
        killers.forEach(reg => { s = s.replace(reg, ""); });

        const temp = document.createElement('div');
        temp.innerHTML = s;

        if (!incMenu) {
            // DOM 级别清洗
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
        text = text.replace(/<think>[\s\S]*?<\/think>/gi, ""); 

        // 【新增文本级防漏杀】：如果勾选了不复制面板，利用纯文本正则把遗留的面板文字直接干掉！
        if (!incMenu) {
            const holoTextRegex = /💠\s*档案:.*?\|\s*状态更新[\s\S]*?事件：[^\n]*\n[^\n]*/g;
            text = text.replace(holoTextRegex, "");
        }

        return text.replace(/\n{3,}/g, "\n\n").trim();
    }
