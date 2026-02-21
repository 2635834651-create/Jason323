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

        // 【第一道闸门：HTML 级物理斩断】
        // 如果不包含菜单栏/面板，只要看到面板特有的类名，连同后面的所有代码直接删除
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
        // 无论 HTML 怎么崩坏，只要提取出的纯文本里出现面板的标志位，
        // 就把这个标志位及其之后的所有字符（[\s\S]*）全部抹杀！
        if (!incMenu) {
            text = text.replace(/💠\s*档案:[\s\S]*/g, "");
            text = text.replace(/【状态面板】[\s\S]*/g, "");
        }

        return text.replace(/\n{3,}/g, "\n\n").trim();
    }
