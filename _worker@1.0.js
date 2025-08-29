/*域名监控系统 - Cloudflare Workers*/
/*使用KV存储域名信息*/

// iconfont阿里巴巴图标库
const ICONFONT_CSS = '//at.alicdn.com/t/c/font_4973034_1qunj5fctpb.css';
const ICONFONT_JS = '//at.alicdn.com/t/c/font_4973034_1qunj5fctpb.js';

// 网站图标和背景图片，可在环境变量中设置
const DEFAULT_LOGO = 'https://cdn.jsdelivr.net/gh/kamanfaiz/CF-Domain-AutoCheck@main/img/logo.png'; // 默认Logo图片，外置变量名为LOGO_URL
const DEFAULT_BACKGROUND = 'https://cdn.jsdelivr.net/gh/kamanfaiz/CF-Domain-AutoCheck@main/img/background.png'; // 默认背景图片，外置变量名为BACKGROUND_URL
const DEFAULT_MOBILE_BACKGROUND = 'https://cdn.jsdelivr.net/gh/kamanfaiz/CF-Domain-AutoCheck@main/img/mobile2.png'; // 默认手机端背景图片，留空则使用桌面端背景图片，外置变量名为MOBILE_BACKGROUND_URL

// 登录密码设置
const DEFAULT_TOKEN = ''; // 在此处设置默认密码，留空则使用'domain'，外置变量名为TOKEN

// Telegram通知配置
const DEFAULT_TG_TOKEN = ''; // 你的Telegram机器人Token，留空则尝试读取环境变量中TG_TOKEN的值
const DEFAULT_TG_ID = '';    // 你的Telegram聊天ID，留空则尝试读取环境变量中TG_ID的值

// 网站标题配置
const DEFAULT_SITE_NAME = ''; // 默认网站标题，外置环境变量名为SITE_NAME

// 登录页HTML模板
const getLoginHTML = (title) => `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <!-- 添加网站图标(favicon) -->
    <link rel="icon" href="${typeof LOGO_URL !== 'undefined' ? LOGO_URL : DEFAULT_LOGO}" type="image/png">
    <link rel="shortcut icon" href="${typeof LOGO_URL !== 'undefined' ? LOGO_URL : DEFAULT_LOGO}" type="image/png">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- 添加阿里巴巴iconfont图标库支持 -->
    <link rel="stylesheet" href="${ICONFONT_CSS}">
    <!-- 确保图标正确加载 -->
    <script src="${ICONFONT_JS}"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            height: 100vh;
            background-image: url('${typeof BACKGROUND_URL !== 'undefined' ? BACKGROUND_URL : DEFAULT_BACKGROUND}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }
        
        /* 登录界面移动端背景图片适配 */
        @media (max-width: 768px) {
            body {
                background-image: url('${typeof MOBILE_BACKGROUND_URL !== 'undefined' && MOBILE_BACKGROUND_URL ? MOBILE_BACKGROUND_URL : (DEFAULT_MOBILE_BACKGROUND ? DEFAULT_MOBILE_BACKGROUND : (typeof BACKGROUND_URL !== 'undefined' ? BACKGROUND_URL : DEFAULT_BACKGROUND))}');
                background-attachment: scroll;
                background-position: center;
            }
        }
        
        body::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.4); /* 这里调整登录界面背景图的黑色蒙版不透明度 */
            z-index: 1;
        }
        
        .github-corner {
            position: fixed;
            top: 0;
            right: 0;
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 0 100px 100px 0;
            border-color: transparent rgba(53, 83, 248, 0.9) transparent transparent;
            color: white;
            text-decoration: none;
            z-index: 1000;
            transition: all 0.3s ease;
            overflow: visible; /* 确保图标不会被裁剪 */
        }
        .github-corner:hover {
            border-color: transparent rgba(99, 122, 250, 0.8) transparent transparent;
        }
        .github-corner i {
            position: absolute;
            top: 18px;
            right: -82.5px;
            font-size: 40px;
            transform: rotate(45deg); /* 顺时针旋转45度 */
            line-height: 1;
            display: inline-block; /* 确保图标有确定的尺寸 */
            width: 40px; /* 设置宽度与字体大小相同 */
            height: 40px; /* 设置高度与字体大小相同 */
            text-align: center; /* 文本居中 */
        }
        .login-container {
            background-color: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border-radius: 16px;
            padding: 35px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.18);
            position: relative;
            z-index: 10;
        }
        .login-title {
            text-align: center;
            color: #ffffff;
            margin-bottom: 25px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center; /* 保持居中 */
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            margin-left: 0; /* 保留无左边距 */
            margin-right: auto;
            width: 100%;
            padding-left: 0; /* 完全移除左内边距 */
            margin-right: 8px; /* 添加右边距以平衡 */
        }
        .login-logo {
            height: 64px;
            width: 64px;
            margin-right: 0px; /* 控制logo和标题文字之间的间距 */
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
            vertical-align: middle;
        }
        .form-control {
            background-color: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 14px;
            height: auto;
            color: #fff;
            font-size: 1.05rem;
            border-radius: 10px;
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            transition: all 0.3s ease;
        }
        .form-control::placeholder {
            color: rgba(255, 255, 255, 0.8);
        }
        .form-control:focus {
            background-color: rgba(255, 255, 255, 0.25);
            border-color: rgba(255, 255, 255, 0.5);
            box-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.2);
            color: #fff;
        }
        .btn-login {
            background-color: rgba(53, 83, 248, 0.9); // 登录按钮的颜色
            border: none;
            color: white;
            padding: 12px;
            width: 100%;
            font-weight: 500;
            font-size: 1.05rem;
            border-radius: 10px;
            margin-top: 10px;
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            transition: all 0.3s ease;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }
        .btn-login:hover {
            background-color: rgba(99, 122, 250, 0.8);  // 登录按钮的悬停颜色
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
        }
        .error-message {
            color: #ffcccc;
            margin-top: 15px;
            text-align: center;
            display: none;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
    </style>
</head>
<body>
    <a href="https://github.com/kamanfaiz/CF-Domain-Autocheck" target="_blank" class="github-corner" title="GitHub Repository">
        <i class="iconfont icon-github1"></i>
    </a>
    <div class="login-container">
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
            <h2 class="login-title">
                <img src="${typeof LOGO_URL !== 'undefined' ? LOGO_URL : DEFAULT_LOGO}" alt="Logo" class="login-logo">
                <span>${title}</span>
            </h2>
            <form id="loginForm" style="width: 100%;">
                <div class="mb-3">
                    <input type="password" class="form-control" id="password" placeholder="请输入访问密码" required>
                </div>
                <button type="submit" class="btn btn-login"><i class="iconfont icon-mima" style="margin-right: 5px;"></i>登录</button>
                <div id="errorMessage" class="error-message">密码错误，请重试</div>
            </form>
        </div>
    </div>
    
    <script>
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const password = document.getElementById('password').value;
            
            // 使用POST请求验证密码
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: password })
            })
            .then(response => {
                if (response.ok) {
                    // 密码正确，跳转到dashboard页面
                    window.location.href = '/dashboard';
                } else {
                    // 密码错误，显示错误信息
                    document.getElementById('errorMessage').style.display = 'block';
                }
            })
            .catch(error => {
                console.error('登录请求失败:', error);
                document.getElementById('errorMessage').style.display = 'block';
            });
        });
    </script>
</body>
</html>
`;

// HTML模板
const getHTMLContent = (title) => `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <!-- 添加网站图标(favicon) -->
    <link rel="icon" href="${typeof LOGO_URL !== 'undefined' ? LOGO_URL : DEFAULT_LOGO}" type="image/png">
    <link rel="shortcut icon" href="${typeof LOGO_URL !== 'undefined' ? LOGO_URL : DEFAULT_LOGO}" type="image/png">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- 添加阿里巴巴iconfont图标库支持 -->
    <link rel="stylesheet" href="${ICONFONT_CSS}">
    <!-- 确保图标正确加载 -->
    <script src="${ICONFONT_JS}"></script>
        <!-- 添加登出脚本 -->
    <script>
        // 添加登出功能
        function logout() {
            window.location.href = '/logout';
        }
    </script>
    <style>
        :root {
            --primary-color: #4e54c8;
            --secondary-color: #6c757d;
            --success-color:rgb(0, 255, 60);
            --danger-color:rgb(255, 0, 25);
            --warning-color:rgb(255, 230, 0);
            --info-color: #17a2b8;
            --light-color: #f8f9fa;
            --dark-color: #343a40;
            --domain-note-spacing: 2px; /* 域名和备注标签之间的间距 */
            --domain-line-height: 1.15; /* 域名换行后的行高 */
        }
        
        body {
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            background-image: url('${typeof BACKGROUND_URL !== 'undefined' ? BACKGROUND_URL : DEFAULT_BACKGROUND}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: fixed;
            padding-top: 20px;
            position: relative;
            min-height: 100vh;
        }
        
        /* 移动端背景图片优化 */
        @media (max-width: 768px) {
            body {
                background-attachment: scroll;
                background-size: cover;
                background-position: center top;
                min-height: 100vh;
                /* 移动端使用专门的背景图片，如果没有则回退到桌面端背景图片 */
                background-image: url('${typeof MOBILE_BACKGROUND_URL !== 'undefined' && MOBILE_BACKGROUND_URL ? MOBILE_BACKGROUND_URL : (DEFAULT_MOBILE_BACKGROUND ? DEFAULT_MOBILE_BACKGROUND : (typeof BACKGROUND_URL !== 'undefined' ? BACKGROUND_URL : DEFAULT_BACKGROUND))}');
            }
            
            /* 使用伪元素固定背景，避免缩放问题 */
            body::after {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100vh;
                background-image: url('${typeof MOBILE_BACKGROUND_URL !== 'undefined' && MOBILE_BACKGROUND_URL ? MOBILE_BACKGROUND_URL : (DEFAULT_MOBILE_BACKGROUND ? DEFAULT_MOBILE_BACKGROUND : (typeof BACKGROUND_URL !== 'undefined' ? BACKGROUND_URL : DEFAULT_BACKGROUND))}');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                z-index: -2;
                pointer-events: none;
            }
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.55); /* 这里调整登录后界面背景图的黑色蒙版不透明度 */
            z-index: -1;
        }
        
        .navbar {
            background-color: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.18);
            margin-bottom: 24px;
            padding: 14px 20px;
            border-radius: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 2;
        }
        
        .navbar-brand {
            display: flex;
            align-items: center;
            font-weight: 600;
            color: #ffffff;
            font-size: 1.7rem;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            gap: 2px; /* 使用gap属性统一控制子元素之间的间距 */
        }
        
        .navbar-brand i {
            font-size: 1.8rem;
            color: white;
            margin: 0; /* 移除所有margin */
        }
        
        .logo-link {
            display: flex;
            align-items: center;
            margin-right: 0px;
            text-decoration: none;
        }
        
        .logo-img {
            height: 64px;
            width: 64px;
            object-fit: contain;
            transition: transform 0.3s ease;
        }
        
        .logo-img:hover {
            transform: scale(1.1);
            cursor: pointer;
            filter: brightness(1.2);
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .logo-img.refreshing {
            animation: pulse 0.8s ease-in-out;
        }
        
        .navbar-actions {
            margin-left: auto;
            display: flex;
            align-items: center;
        }
        
        .btn-logout {
            margin-left: 10px;
            background-color: transparent;
            border: 1px solid #dc3545;
            color: #dc3545;
            padding: 5px 15px;
            border-radius: 5px;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .btn-logout:hover {
            background-color: #dc3545;
            color: white;
        }
        
        .container {
            max-width: 1200px;
            position: relative;
            z-index: 1;
        }
        
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding: 12px 20px;
            background-color: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            position: relative;
            z-index: 2;
        }
        
        .page-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: #ffffff;
            margin: 0;
            display: flex;
            align-items: center;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .page-title i {
            margin-right: 8px;
            font-size: 1.2rem;
        }
        
        .btn-action-group {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 10px;
            margin-left: auto;
        }
        
        .btn-primary {
            background-color: var(--primary-color);
            border-color: var(--primary-color);
        }
        
        .btn-primary:hover {
            background-color: #3f44ae;
            border-color: #3f44ae;
        }
        
        .card {
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            margin-bottom: 8px; /* 进一步减小卡片间的垂直间距 */
            transition: all 0.3s;
            overflow: hidden !important; /* 确保内容不会溢出 */
            position: relative;
            z-index: 1; /* 设置卡片的基础z-index */
            width: 100%;
            background-color: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
        }
        
        /* ===== 卡片头部样式 - 开始 ===== */
        /* 卡片头部容器 */
        .card-header {
            background-color: rgba(255, 255, 255, 0.1);
            border-bottom: 1px solid rgba(255, 255, 255, 0.18);
            padding: 15px 0; /* 移除左右内边距，改为在各元素上单独控制 */
            padding-top: 12px;
            padding-bottom: 12px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            overflow: hidden; /* 防止内容溢出 */
            border-top-left-radius: 16px;
            border-top-right-radius: 16px;
            gap: 0; /* 移除间距，改为在各元素上单独控制 */
            min-height: 84px; /* 最小高度 */
            height: auto; /* 自动调整高度以适应内容 */
            max-height: 140px; /* 最大高度限制 */
            box-sizing: border-box; /* 确保padding不会增加元素高度 */
        }
        
        /* 状态指示圆点 */
        .status-dot {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 10px; /* 与域名文字的间距 */
            margin-left: 20px; /* 与卡片左边的间距 */
            vertical-align: middle;
            flex-shrink: 0;
        }
        
        .status-dot.expired {
            background-color: var(--danger-color);
            box-shadow: 0 0 5px var(--danger-color);
        }
        
        .status-dot.warning {
            background-color: var(--warning-color);
            box-shadow: 0 0 5px var(--warning-color);
        }
        
        .status-dot.safe {
            background-color: var(--success-color);
            box-shadow: 0 0 5px var(--success-color);
        }
        
        /* 域名标题区域 */
        .domain-header {
            display: flex;
            flex-direction: column;
            justify-content: center;
            flex: 1;
            min-width: 0; /* 解决flex子项目溢出问题 */
            max-width: calc(100% - 2px); /* 限制最大宽度，为右侧状态标签留出空间 */
            overflow: hidden; /* 确保内容不会溢出 */
            padding-left: 5px; /* 与小圆点的间距 */
            padding-right: 2px; /* 与右侧状态标签的间距 */
            transition: all 0.3s ease; /* 添加过渡效果 */
            min-height: 60px; /* 最小高度，可根据内容自动增加 */
            height: auto; /* 自动调整高度以适应内容 */
            max-height: 120px; /* 设置最大高度限制 */
        }
        
        .domain-header h5 {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis; /* 添加省略号 */
            color: #ffffff;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            font-size: 1.25rem; /* 设置域名字体大小 */
            font-weight: 600; /* 加粗字体 */
            transition: white-space 0.3s ease; /* 添加过渡效果 */
            margin: 0; /* 重置所有margin */
            line-height: 1.5;
        }
        
        /* 展开状态下的域名显示 */
        .domain-card.expanded .domain-header h5 {
            white-space: normal; /* 允许换行 */
            word-wrap: break-word; /* 确保长单词也能换行 */
            word-break: break-all; /* 在任何字符间换行 */
        }
        
        /* 域名容器样式 */
        .domain-name-container {
            display: flex;
            flex-direction: column;
        }
        
        /* 域名标题样式 */
        .domain-title {
            display: inline-block;
            margin-bottom: 0; /* 确保没有额外的底部边距 */
        }
        
        /* 备注标签样式 */
        .domain-header .domain-meta {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.2;
        }
        
        /* 展开状态下的域名显示 */
        .domain-card.expanded .domain-title {
            display: block; /* 确保域名可以正常换行 */
        }
        
        /* 域名文字样式 */
        .domain-text {
            display: inline;
        }
        
        /* 展开状态下域名文字样式 */
        .domain-card.expanded .domain-title .domain-text {
            display: inline-block;
            line-height: var(--domain-line-height); /* 控制行高，即行间距 */
        }
        
        /* 确保展开状态下域名文字能够正确换行 */
        .domain-card.expanded .domain-title {
            word-break: break-all;
            word-wrap: break-word;
        }
        
        /* 间隔元素样式 */
        .spacer {
            display: block;
            width: 100%;
            /* 高度由内联样式通过CSS变量控制 */
            flex-shrink: 0; /* 防止被压缩 */
        }
        
        /* 自定义备注样式 - 多种颜色标签风格 */
        .domain-meta .text-info, .domain-meta [class*="tag-"], .note-preview {
            background-color: #3B82F6; /* 默认蓝色 */
            color: white !important;
            font-weight: 500;
            padding: 3px 12px;
            border-radius: 16px;
            display: inline-block;
            font-size: 0.8rem;
            box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3);
            letter-spacing: 0.2px;
        }
        
        /* 自定义备注颜色类 - 只修改颜色，保留原有样式 */
        .text-info.tag-blue { background-color: #3B82F6 !important; box-shadow: 0 1px 3px rgba(59, 130, 246, 0.3) !important; }
        .text-info.tag-green { background-color: #10B981 !important; box-shadow: 0 1px 3px rgba(16, 185, 129, 0.3) !important; }
        .text-info.tag-red { background-color: #EF4444 !important; box-shadow: 0 1px 3px rgba(239, 68, 68, 0.3) !important; }
        .text-info.tag-yellow { background-color: #F59E0B !important; box-shadow: 0 1px 3px rgba(245, 158, 11, 0.3) !important; }
        .text-info.tag-purple { background-color: #8B5CF6 !important; box-shadow: 0 1px 3px rgba(139, 92, 246, 0.3) !important; }
        .text-info.tag-pink { background-color: #EC4899 !important; box-shadow: 0 1px 3px rgba(236, 72, 153, 0.3) !important; }
        .text-info.tag-indigo { background-color: #6366F1 !important; box-shadow: 0 1px 3px rgba(99, 102, 241, 0.3) !important; }
        .text-info.tag-gray { background-color: #6B7280 !important; box-shadow: 0 1px 3px rgba(107, 114, 128, 0.3) !important; }
        
        /* 分类容器样式 */
        .domain-group-container {
            margin-bottom: 4px; /* 分类之间的间距 */
        }
        
        /* 确保分类标题与卡片左对齐 */
        .col-12.px-1-5 {
            padding-left: 0.375rem !important; /* 与卡片列相同的左内边距 */
        }
        
        /* 分类标题样式 */
        .category-header {
            padding: 8px 0; /* 移除左右内边距 */
            margin-bottom: 2px; /* 分类标题和卡片的间距 */
            margin-left: 10px; /* 增加左边距，使文字与卡片对齐 */
            display: block; /* 改为块级元素，确保宽度占满 */
            min-width: 120px;
        }
        
        .category-title {
            margin: 0;
            padding: 0;
            color: white;
            font-size: 1.8rem;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
        }
        
        /* 状态区域 */
.domain-status {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0; /* 防止被压缩 */
    min-width: 100px; /* 增加最小宽度，确保状态标签有足够空间 */
    padding-right: 20px; /* 下拉按钮与卡片右边的间距 */
    margin-left: 10px; /* 与域名区域的间距 */
}
        
        .domain-status .badge {
            margin-right: 10px; /* 与下拉箭头的间距 */
            white-space: nowrap; /* 确保标签文本不换行 */
            padding: 5px 10px;
            border-radius: 20px;
            font-weight: 500;
            color: white;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .badge .iconfont {
            margin-right: 3px;
            font-size: 0.9rem;
            vertical-align: middle;
            color: white;
        }
        
        /* 下拉按钮 */
        .toggle-details {
            padding: 0;
            margin-left: 0; /* 与状态标签的间距 */
            color: white;
            background: none;
            border: none;
            box-shadow: none;
            position: relative;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            text-decoration: none !important;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .toggle-details:hover {
            color: rgba(255, 255, 255, 0.8);
        }
        
        /* 图标容器 */
        .toggle-icon-container {
            position: relative;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden; /* 防止内容溢出 */
            line-height: 1;
        }
        
        /* 箭头图标 */
        .toggle-icon {
            font-size: 16px;
            transition: transform 0.3s ease;
            margin-right: 0 !important; /* 覆盖默认的margin-right */
            display: block;
            line-height: 1;
        }
        /* ===== 卡片头部样式 - 结束 ===== */
        
        .card-body .d-flex {
            margin-right: 0;
            padding-right: 0;
            overflow: visible !important;
        }
        
        /* 移除单独的百分比值样式，改为直接在SVG中使用text元素 */
        
        .card-header,
        .card-body {
            padding-left: 0; /* 移除左内边距 */
            padding-right: 0; /* 移除右内边距 */
            position: relative;
        }
        
        /* 卡片头部相关样式已移至上方统一管理区域 */
        
        /* 骨架屏样式 */
        .skeleton-card {
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            animation: skeleton-pulse 1.5s infinite ease-in-out;
        }
        
        .skeleton-header {
            background-color: rgba(255, 255, 255, 0.15);
            padding: 16px;
            border-top-left-radius: 12px;
            border-top-right-radius: 12px;
        }
        
        .skeleton-text-lg {
            height: 24px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            margin-bottom: 8px;
            width: 70%;
        }
        
        .skeleton-text-sm {
            height: 16px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            width: 50%;
        }
        
        .skeleton-text {
            height: 16px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            margin-bottom: 8px;
            width: 90%;
        }
        
        .skeleton-progress {
            height: 24px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            margin-top: 16px;
        }
        
        @keyframes skeleton-pulse {
            0% {
                opacity: 0.6;
            }
            50% {
                opacity: 0.8;
            }
            100% {
                opacity: 0.6;
            }
        }
        
        /* 自定义测试成功消息的颜色 */
        .telegram-test-success {
            color:rgb(19, 221, 144) !important; /* 紫色 */
            font-weight: 500;
        }
        
        /* 状态区域样式已移至上方统一管理区域 */
        
        .progress-circle-container {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            padding-right: 10px;
            box-sizing: border-box;
            overflow: visible;
            position: absolute;
            right: 0;
            top: 35%; /* 进度条向上移动 */
            transform: translateY(-50%);
            z-index: 10; /* 提高z-index值确保在文本上方 */
            min-width: 65px;
        }
        
        .progress-circle {
            position: relative;
            width: 65px;
            height: 65px;
            margin: 0;
            box-sizing: border-box;
            overflow: visible;
            z-index: 6; /* 降低z-index值 */
        }
        
        .progress-circle-bg {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 6px solid #f5f5f5;
            box-sizing: border-box;
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 7; /* 降低z-index值 */
        }
        
        .progress-circle-value {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 0.95rem;
            font-weight: bold;
        }
        
        .progress-ring {
            position: relative;
            transform: rotate(-90deg); /* 从12点钟方向开始 */
            z-index: 8; /* 降低z-index值 */
        }
        
        /* 添加样式使SVG中的文本不旋转 */
        .progress-ring text {
            transform: rotate(90deg); /* 抵消父元素的旋转 */
            fill: #ffffff; /* 改为白色 */
            font-size: 14px;
            font-weight: bold;
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            dominant-baseline: central;
            text-anchor: middle;
            paint-order: stroke;
            stroke: rgba(0, 0, 0, 0.3); /* 改为半透明黑色描边 */
            stroke-width: 1px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3); /* 添加文字阴影 */
        }
        
        .progress-ring-circle {
            transition: stroke-dashoffset 0.35s;
            transform-origin: center;
            z-index: 9; /* 降低z-index值 */
        }
        
        /* 进度条百分比文字样式 */
        .progress-percent-text {
            font-size: 14px;
            font-weight: bold;
            color: #ffffff;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .card-body {
            padding: 12px 15px;
            padding-left: 20px; /* 恢复卡片内容的左内边距 */
            padding-right: 20px; /* 恢复卡片内容的右内边距 */
            overflow: visible !important;
        }
        
        /* 折叠区域样式 */
        .collapse {
            margin: 0;
            padding: 0;
        }
        
        .domain-card {
            transition: all 0.3s;
        }
        
        .domain-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        /* 域名列样式 */
        .domain-column {
            display: flex;
            flex-direction: column;
        }
        
        /* 完全移除底部边框，仅在展开状态下显示 */
        .domain-card .card::after {
            content: none; /* 默认不显示任何内容 */
        }
        
        /* 展开状态下显示底部边框 */
        .domain-card.expanded .card {
            border-bottom: 1px solid rgba(255, 255, 255, 0.18);
            border-bottom-left-radius: 16px;
            border-bottom-right-radius: 16px;
        }
        
        /* 域名列样式 */
        .domain-column {
            display: flex;
            flex-direction: column;
        }
        
        /* 状态指示圆点样式已移至上方统一管理区域 */
        
        /* 域名卡片容器样式 */
        .domain-card-container {
            margin-bottom: 12px; /* 统一设置卡片间距 */
            position: relative;
            border-radius: 16px; /* 确保容器也有圆角 */
            overflow: hidden; /* 防止内容溢出 */
        }
        
        /* Badge样式已移至上方统一管理区域 */
        
        /* 下拉按钮相关样式已移至上方统一管理区域 */
        
        /* 当展开时旋转箭头 */
        .toggle-details:not(.collapsed) .toggle-icon {
            transform: rotate(90deg);
        }
        
        /* 折叠内容样式 */
        .details-content {
            padding-top: 10px;
        }
        
        .domain-tag {
            display: inline-block;
            padding: 3px 8px;
            margin-left: 8px;
            border-radius: 20px;
            background-color: #f8f9fa;
            color: #666;
            font-size: 0.75rem;
            font-weight: normal;
            vertical-align: middle;
        }
        
        .domain-info {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.75rem;
        }
        
        .domain-actions {
            display: flex;
            gap: 5px;
            justify-content: flex-end;
        }
        
        .domain-actions .btn {
            padding: 5px 10px;
            font-size: 0.85rem;
        }
        
        .badge {
            padding: 5px 10px;
            border-radius: 20px;
            font-weight: 500;
        }
        
        .btn-action {
            padding: 5px 10px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 500;
            transition: all 0.2s;
        }
        
        .btn-action:hover {
            /* 移除浮动效果，只保留颜色变化 */
        }
        
        .btn-outline-primary {
            color: var(--primary-color);
            border-color: var(--primary-color);
        }
        
        .btn-outline-primary:hover {
            background-color: var(--primary-color);
            color: white;
        }
        
        .btn-outline-success {
            color: var(--success-color);
            border-color: var(--success-color);
        }
        
        .btn-outline-success:hover {
            background-color: var(--success-color);
            color: white;
        }
        
        .btn-outline-danger {
            color: var(--danger-color);
            border-color: var(--danger-color);
        }
        
        .btn-outline-danger:hover {
            background-color: var(--danger-color);
            color: white;
        }
        
        .btn-outline-info {
            color: var(--info-color);
            border-color: var(--info-color);
        }
        
        .btn-outline-info:hover {
            background-color: var(--info-color);
            color: white;
        }
        
        /* 视图按钮样式 */
        .view-option {
            color: rgb(223, 223, 223) !important; /* 未选状态使用灰色文字 */
            background-color: rgba(204, 204, 204, 0.8) !important; /* 未选状态的背景色 */
            border-color:rgba(109, 109, 109, 0.3) !important; /* 修改边框颜色 */
        }
        
        .view-option.btn-info {
            background-color:rgb(255, 255, 255) !important; /* 修改选中状态背景色为蓝色 */
            color: rgb(31, 34, 39) !important; /* 选中状态使用白色文字 */
        }
        
        .view-option .view-text {
            font-weight: 500;
        }
        
        /* 添加新域名按钮自定义样式 */
        .add-domain-btn {
            background-color:rgb(42, 175, 86) !important; /* 绿色 */
            border-color:rgba(33, 148, 72, 0.8) !important;
        }
        
        .add-domain-btn:hover {
            background-color:rgb(24, 216, 120) !important; /* 深绿色 */
            border-color:rgba(38, 190, 114, 0.8) !important;
        }
        
        /* 排序按钮自定义样式 */
        .sort-btn {
            background-color: rgb(0, 123, 255) !important; /* 蓝色 */
            border-color: rgba(0, 111, 230, 0.8) !important;
        }
        
        .sort-btn:hover {
            background-color: rgb(0, 162, 255) !important; /* 蓝色 */
            border-color: rgba(23, 137, 202, 0.8) !important;
            
        }
        
        /* 排序选项的勾选图标样式 */
        .sort-check {
            visibility: hidden;
            margin-right: 5px;
            /* 使用与文字相同的颜色 */
            color: inherit;
        }
        
        .sort-option.active .sort-check {
            visibility: visible;
        }
        
        /* 排序选项选中状态样式 - 只显示勾符号，不使用背景色 */
        .sort-option.active {
            background-color: transparent !important;
            color: white !important;
        }
        
        /* 确保所有排序选项文字左对齐 */
        .dropdown-item {
            display: flex;
            align-items: center;
        }
        
        /* 添加iconfont图标的通用样式 */
        .iconfont {
            font-size: 1rem;
            vertical-align: middle;
            margin-right: 4px;
        }
        
        /* 按钮中的图标特殊样式 */
        .btn-action .iconfont {
            font-size: 0.9rem;
        }
        
        /* 表单和模态框中的图标统一样式 */
        .modal-body .iconfont {
            color: #555;
        }
        
        /* 大号图标样式 */
        .iconfont-lg {
            font-size: 1.5rem;
        }
        
        /* 不同颜色的图标 */
        .icon-primary { color: var(--primary-color); }
        .icon-success { color: var(--success-color); }
        .icon-danger { color: var(--danger-color); }
        .icon-warning { color: var(--warning-color); }
        .icon-info { color: var(--info-color); }
        
        .domain-actions {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            gap: 5px;
            margin-bottom: 8px;
        }
        
        .domain-actions .btn {
            flex-grow: 1;
            text-align: center;
            padding: 8px 0;
            border-radius: 6px;
            font-weight: 500;
            font-size: 0.85rem;
        }
        
        /* 纯图标按钮样式 - 用于替换文字按钮 */
        .btn-icon-only {
            width: 40px;
            height: 40px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            flex-grow: 1;
            max-width: 40px;
        }
        
        .btn-icon-only .iconfont {
            margin: 0;
            font-size: 1.2rem;
        }
        
        /* 纯图标链接样式 */
        .link-icon-only {
            width: 40px;
            height: 40px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            flex-grow: 1;
            max-width: 40px;
        }
        
        .link-icon-only .iconfont {
            margin: 0;
            font-size: 1.2rem;
        }
        
        /* 域名操作按钮行样式 */
        .domain-actions {
            display: flex;
            justify-content: space-between;
            gap: 3px;
            margin-top: 12px;
            margin-bottom: 8px;
            flex-wrap: nowrap;
            width: 100%;
        }
        
        .domain-actions .btn,
        .domain-actions a.btn {
            flex: 1;
            padding: 6px 2px;
            font-size: 0.7rem;
            white-space: nowrap;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            color: white;
            border: none;
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
        }
        
        .domain-actions .btn:hover,
        .domain-actions a.btn:hover {
            /* 移除浮动效果，只保留颜色变化 */
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            color: white;
        }
        
        .domain-actions .iconfont {
            margin-right: 2px;
            font-size: 0.85rem;
            display: inline-block !important;
            vertical-align: middle;
            color: white;
        }
        
        /* 按钮颜色 */
        .btn-primary, .btn-outline-primary {
            background-color: rgba(47, 103, 167, 0.9);
            border-color: rgba(37, 86, 141, 0.3);
        }
        
        /* 在这里添加悬停样式 */
        .btn-primary:hover {
            background-color: rgba(0, 119, 255, 0.7);
            border-color: rgba(0, 119, 255, 0.3);
        }
        
        .btn-success, .btn-outline-success {
            background-color: rgba(40, 167, 69, 0.7);
            border-color: rgba(40, 167, 69, 0.3);
        }

        .btn-success:hover {
            background-color: rgba(69, 211, 102, 0.8);
            border-color: rgba(47, 196, 81, 0.3);
        }
        
        /* 自定义状态标签颜色 */
        .bg-success {
            background-color: rgba(42, 165, 93, 0.8) !important;
        }
        
        .btn-info, .btn-outline-info {
            background-color: rgba(23, 162, 184, 0.7);
            border-color: rgba(23, 162, 184, 0.3);
        }
        
        .btn-warning, .btn-outline-warning {
            background-color: rgba(255, 193, 7, 0.7);
            border-color: rgba(255, 193, 7, 0.3);
        }
        
        .btn-danger, .btn-outline-danger {
            background-color: rgba(220, 53, 69, 0.7);
            border-color: rgba(220, 53, 69, 0.3);
        }
        
        .btn-secondary, .btn-outline-secondary {
            background-color: rgba(108, 117, 125, 0.7);
            border-color: rgba(108, 117, 125, 0.3);
        }
        
        /* 续期链接样式已整合到按钮行中 */
        
        .test-notify-btn {
            width: 100%;
            border-radius: 6px;
            padding: 8px 0;
            font-weight: 500;
            font-size: 0.85rem;
            background-color: white;
            border: 1px solid #17a2b8;
            color: #17a2b8;
        }
        
        .test-notify-btn:hover {
            background-color: #17a2b8;
            color: white;
        }
        
        .card-text {
            margin-bottom: 6px;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            padding-left: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .card-text strong {
            color: #ffffff;
            font-weight: 600;
            font-size: 0.85rem;
            margin-right: 4px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .card-text .iconfont {
            margin-right: 6px;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.85rem;
            width: 16px;
            text-align: center;
            display: inline-flex;
            justify-content: center;
        }
        
        .modal-content {
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            background-color: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
        }
        
        .modal-header {
            border-bottom: 1px solid rgba(255, 255, 255, 0.18);
            background-color: rgba(255, 255, 255, 0.1);
            padding: 15px 20px;
            color: white;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .modal-footer {
            border-top: 1px solid rgba(255, 255, 255, 0.18);
            padding: 15px 20px;
            background-color: rgba(255, 255, 255, 0.05);
        }
        
        /* 确保下拉菜单显示在最上层 */
        .dropdown-menu {
            z-index: 1050 !important;
            background-color: rgba(60, 65, 70, 0.75) !important; /* 更浅的背景色 */
            backdrop-filter: blur(15px) !important;
            -webkit-backdrop-filter: blur(15px) !important;
            border: 1px solid rgba(255, 255, 255, 0.25) !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35) !important;
            padding: 8px !important;
            border-radius: 10px !important;
        }
        
        .dropdown-item {
            font-size: 0.85rem;
            padding: 0.5rem 1rem;
            color: white !important;
            border-radius: 6px;
            margin-bottom: 2px;
            font-weight: 500;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .dropdown-item:hover {
            background-color: rgba(255, 255, 255, 0.25) !important;
            color: white !important;
        }
        
        .dropdown-divider {
            border-top: 1px solid rgba(255, 255, 255, 0.25) !important;
            margin: 6px 0;
        }
        
        /* 自定义间距类 */
        .px-1-5 {
            padding-left: 0.375rem !important;
            padding-right: 0.375rem !important;
        }
        
        .form-label {
            font-weight: 500;
            color: white;
            display: flex;
            align-items: center;
            gap: 5px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .form-label .iconfont,
        .modal-body h6 .iconfont,
        .modal-body .form-text .iconfont {
            color: rgba(255, 255, 255, 0.9);
            margin-right: 0;
            font-size: 0.95rem;
        }
        
        .modal-body {
            color: white;
        }
        
        .modal-body .form-text {
            color: rgba(255, 255, 255, 0.8);
        }
        
        .form-control {
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 10px 15px;
            background-color: rgba(255, 255, 255, 0.2);
            color: white;
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
        }
        
        .form-control:focus {
            border-color: rgba(255, 255, 255, 0.5);
            box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25);
            background-color: rgba(255, 255, 255, 0.25);
            color: white;
        }
        
        .form-control::placeholder {
            color: rgba(255, 255, 255, 0.7);
        }
        
        .form-select {
            background-color: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            border-radius: 10px;
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
        }
        
        .form-select:focus {
            border-color: rgba(255, 255, 255, 0.5);
            box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.25);
            background-color: rgba(255, 255, 255, 0.25);
        }
        
        /* 添加select下拉选项的样式 */
        .form-select option {
            background-color: #333;
            color: white;
            padding: 8px;
        }
        
        .alert {
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        
        @media (max-width: 768px) {
            .domain-card {
                flex-direction: column;
            }
            
            .domain-card .card-header {
                width: 100%;
                border-right: none;
                border-bottom: 1px solid rgba(255, 255, 255, 0.18);
            }
            
            .domain-card .btn {
                padding: 0.2rem 0.3rem;
                font-size: 0.65rem;
            }
            
            .domain-actions {
                flex-wrap: nowrap;
                gap: 2px;
                margin-top: 8px;
                margin-bottom: 5px;
            }
            
            .domain-actions .btn,
            .domain-actions a.btn {
                padding: 3px 1px;
                font-size: 0.65rem;
            }
            
            .domain-actions .iconfont {
                margin-right: 1px;
                font-size: 0.75rem;
            }
            
            .page-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            
            .btn-action-group {
                width: 100%;
                display: flex;
                justify-content: flex-end;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- 导航栏 -->
        <nav class="navbar">
            <span class="navbar-brand">
                            <a href="javascript:void(0);" class="logo-link" id="refreshLogo" title="点击刷新页面">
                <img src="${typeof LOGO_URL !== 'undefined' ? LOGO_URL : DEFAULT_LOGO}" alt="Logo" class="logo-img">
            </a>
                <i class="iconfont icon-domain iconfont-lg"></i>
                <span style="color: white; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">${title}</span>
            </span>
            <div class="navbar-actions">
                <button class="btn btn-secondary me-3" data-bs-toggle="modal" data-bs-target="#settingsModal">
                    <i class="iconfont icon-gear" style="color: white;"></i> <span style="color: white;">系统设置</span>
                </button>
                <button class="btn btn-danger" onclick="logout()">
                    <i class="iconfont icon-sign-out-alt" style="color: white;"></i> <span style="color: white;">退出</span>
                </button>
            </div>
        </nav>
        
        <!-- 页面标题和操作按钮 -->
        <div class="page-header">
            <h1 class="page-title"><i class="iconfont icon-list-ul"></i> 域名列表</h1>
            <div class="btn-action-group">
                                  <div class="btn-group me-2">
                      <button class="btn btn-outline-info btn-action view-option" data-view="collapse-all" type="button" style="transition: background-color 0.2s, color 0.2s;">
                         <i class="iconfont icon-quanjusuoxiao"></i> <span class="view-text">折叠</span>
                      </button>
                      <button class="btn btn-outline-info btn-action view-option" data-view="expand-all" type="button" style="transition: background-color 0.2s, color 0.2s;">
                         <i class="iconfont icon-quanjufangda"></i> <span class="view-text">展开</span>
                      </button>
                  </div>
                <button class="btn btn-primary btn-action add-domain-btn" data-bs-toggle="modal" data-bs-target="#addDomainModal">
                    <i class="iconfont icon-jia" style="color: white;"></i> <span style="color: white;">添加域名</span>
                </button>
                <div class="dropdown">
                    <button class="btn btn-danger dropdown-toggle btn-action sort-btn" type="button" id="sortDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="iconfont icon-paixu" style="color: white;"></i> <span style="color: white;">域名排序</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="sortDropdown">
                        <li><a class="dropdown-item sort-option" data-sort="suffix" data-order="asc" href="#"><i class="iconfont icon-gou1 sort-check"></i> 按域名后缀升序</a></li>
                        <li><a class="dropdown-item sort-option" data-sort="suffix" data-order="desc" href="#"><i class="iconfont icon-gou1 sort-check"></i> 按域名后缀降序</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item sort-option" data-sort="name" data-order="asc" href="#"><i class="iconfont icon-gou1 sort-check"></i> 按域名升序</a></li>
                        <li><a class="dropdown-item sort-option" data-sort="name" data-order="desc" href="#"><i class="iconfont icon-gou1 sort-check"></i> 按域名降序</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item sort-option" data-sort="daysLeft" data-order="asc" href="#"><i class="iconfont icon-gou1 sort-check"></i> 按剩余天数升序</a></li>
                        <li><a class="dropdown-item sort-option" data-sort="daysLeft" data-order="desc" href="#"><i class="iconfont icon-gou1 sort-check"></i> 按剩余天数降序</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item sort-option" data-sort="customNote" data-order="asc" href="#"><i class="iconfont icon-gou1 sort-check"></i> 按备注升序</a></li>
                        <li><a class="dropdown-item sort-option" data-sort="customNote" data-order="desc" href="#"><i class="iconfont icon-gou1 sort-check"></i> 按备注降序</a></li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="row g-1" id="domainListContainer">
            <!-- 域名卡片将通过JavaScript动态生成 -->
            <div class="col-md-6 col-lg-4 domain-column px-1-5" id="column-1"></div>
            <div class="col-md-6 col-lg-4 domain-column px-1-5" id="column-2"></div>
            <div class="col-md-6 col-lg-4 domain-column px-1-5" id="column-3"></div>
        </div>
    </div>
    
    <!-- 添加域名模态框 -->
    <div class="modal fade" id="addDomainModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">添加新域名</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="addDomainForm">
                        <input type="hidden" id="domainId" value="">
                        <div class="mb-3">
                            <label for="domainName" class="form-label"><i class="iconfont icon-earth-full"></i> 域名(必填)</label>
                            <input type="text" class="form-control" id="domainName" placeholder="请输入域名，如example.com" required>
                        </div>
                        <div class="mb-3">
                            <label for="registrar" class="form-label"><i class="iconfont icon-house-chimney"></i> 注册商(可选)</label>
                            <input type="text" class="form-control" id="registrar" placeholder="请输入注册商名称，如阿里云、腾讯云等">
                            <div class="form-text">将用做分类标准，不填则归入默认分类</div>
                        </div>
                        <!-- 添加自定义备注字段 -->
                        <div class="mb-3">
                            <label for="customNote" class="form-label"><i class="iconfont icon-tags"></i> 自定义备注(可选)</label>
                            <div class="input-group">
                                <input type="text" class="form-control" id="customNote" placeholder="添加备注信息">
                                <select class="form-select" id="noteColor" style="max-width: 120px;">
                                    <option value="tag-blue" selected>蓝色</option>
                                    <option value="tag-green">绿色</option>
                                    <option value="tag-red">红色</option>
                                    <option value="tag-yellow">黄色</option>
                                    <option value="tag-purple">紫色</option>
                                    <option value="tag-pink">粉色</option>
                                    <option value="tag-indigo">靛蓝</option>
                                    <option value="tag-gray">灰色</option>
                                </select>
                            </div>
                            <div class="form-text d-flex align-items-center justify-content-between">
                                <span>将显示在卡片头部域名下方（可选）</span>
                                <div id="notePreview" style="display: none;" class="text-info note-preview">预览</div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="registrationDate" class="form-label"><i class="iconfont icon-calendar-days"></i> 注册时间(必填)</label>
                            <input type="date" class="form-control" id="registrationDate" required>
                            <div class="form-text">域名首次注册的时间</div>
                        </div>
                        
                        <!-- 续期周期设置 -->
                        <div class="mb-3">
                            <label for="renewCycle" class="form-label"><i class="iconfont icon-repeat"></i> 续期周期(必填)</label>
                            <div class="input-group">
                                <input type="number" class="form-control" id="renewCycleValue" value="1" min="1" max="100">
                                <select class="form-select" id="renewCycleUnit">
                                    <option value="year" selected>年</option>
                                    <option value="month">月</option>
                                    <option value="day">日</option>
                                </select>
                            </div>
                            <div class="form-text">域名的常规续期周期，用于计算进度条和到期日期</div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="expiryDate" class="form-label"><i class="iconfont icon-calendar-days"></i> 到期日期(必填)</label>
                            <input type="date" class="form-control" id="expiryDate" required>
                            <div class="form-text text-info">根据注册时间和续期周期自动计算，可手动调整</div>
                        </div>
                        
                        <!-- 价格设置 -->
                        <div class="mb-3">
                            <label for="price" class="form-label"><i class="iconfont icon-licai"></i> 价格(可选)</label>
                            <div class="input-group">
                                <select class="form-select" id="priceCurrency" style="max-width: 80px;">
                                    <option value="¥" selected>¥</option>
                                    <option value="$">$</option>
                                    <option value="€">€</option>
                                    <option value="£">£</option>
                                    <option value="₽">₽</option>
                                </select>
                                <input type="number" class="form-control" id="priceValue" value="" min="0" step="0.01" placeholder="输入价格">
                                <select class="form-select" id="priceUnit" style="max-width: 110px;">
                                    <option value="year" selected>年</option>
                                    <option value="month">月</option>
                                    <option value="day">日</option>
                                </select>
                            </div>
                            <div class="form-text">域名的价格，支持多国货币</div>
                        </div>
                        
                        <!-- 添加续费链接字段 -->
                        <div class="mb-3">
                            <label for="renewLink" class="form-label"><i class="iconfont icon-link"></i> 续费链接(可选)</label>
                            <input type="url" class="form-control" id="renewLink" placeholder="https://example.com/renew">
                            <div class="form-text">域名续费的直达链接</div>
                        </div>
                        
                        <!-- 上次续期时间设置 -->
                        <div class="mb-3" id="lastRenewedContainer" style="display: none;">
                            <div class="d-flex align-items-center">
                                <label class="form-label mb-0 me-3">上次续期时间:</label>
                                <span id="lastRenewedDisplay" class="text-white me-2"></span>
                                <button type="button" class="btn btn-sm btn-danger" id="clearLastRenewed"><span style="color: white;">清除</span></button>
                            </div>
                            <input type="hidden" id="lastRenewed" value="">
                            <div class="form-text">清除后将不再显示上次续期信息，请慎重操作！！</div>
                        </div>
                        
                        <!-- 通知设置 -->
                        <hr>
                        <h6 class="mb-3" style="display: flex; align-items: center; gap: 5px;"><i class="iconfont icon-paper-plane" style="color: white;"></i> 通知设置</h6>
                        <div class="mb-3 form-check">
                            <input type="checkbox" class="form-check-input" id="useGlobalSettings" checked>
                            <label class="form-check-label" for="useGlobalSettings">使用全局通知设置</label>
                        </div>
                        <div id="domainNotifySettings" style="display: none;">
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="notifyEnabled" checked>
                                <label class="form-check-label" for="notifyEnabled">启用到期通知</label>
                            </div>
                            <div class="mb-3">
                                <label for="domainNotifyDays" class="form-label"><i class="iconfont icon-lingdang"></i> 提前通知天数</label>
                                <input type="number" class="form-control" id="domainNotifyDays" min="1" max="90" value="30">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"><span style="color: white;"><i class="iconfont icon-xmark"></i> 取消</span></button>
                                <button type="button" class="btn btn-primary" id="saveDomainBtn"><span style="color: white;"><i class="iconfont icon-save-3-fill"></i> 保存</span></button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- 设置模态框 -->
    <div class="modal fade" id="settingsModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">系统设置</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="settingsForm">
                        <h6 class="mb-3" style="display: flex; align-items: center; gap: 5px;"><i class="iconfont icon-telegram" style="color: white;"></i> Telegram通知设置</h6>
                        <div class="mb-3 form-check">
                            <input type="checkbox" class="form-check-input" id="telegramEnabled">
                            <label class="form-check-label" for="telegramEnabled">启用Telegram通知</label>
                        </div>
                        <div id="telegramSettings" style="display: none;">
                            <div class="mb-3">
                                <label for="telegramToken" class="form-label"><i class="iconfont icon-key"></i> 机器人Token</label>
                                <input type="text" class="form-control" id="telegramToken" placeholder="如已在环境变量中配置则可留空">
                                <div class="form-text">在Telegram中找到@BotFather创建机器人并获取Token</div>
                            </div>
                            <div class="mb-3">
                                <label for="telegramChatId" class="form-label"><i class="iconfont icon-robot-2-fill"></i> 聊天ID</label>
                                <input type="text" class="form-control" id="telegramChatId" placeholder="如已在环境变量中配置则可留空">
                                <div class="form-text">可以使用@userinfobot获取个人ID，或将机器人添加到群组后获取群组ID</div>
                            </div>
                            <div class="mb-3">
                                <label for="notifyDays" class="form-label"><i class="iconfont icon-lingdang"></i> 提前通知天数</label>
                                <input type="number" class="form-control" id="notifyDays" min="1" max="90" value="30">
                                <div class="form-text">域名到期前多少天开始发送通知</div>
                            </div>
                            <div class="mb-3">
                                <button type="button" class="btn btn-info" id="testTelegramBtn"><i class="iconfont icon-paper-plane" style="color: white;"></i> <span style="color: white;">测试Telegram通知</span></button>
                                <span id="testResult" class="ms-2"></span>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"><span style="color: white;"><i class="iconfont icon-xmark"></i> 取消</span></button>
                                <button type="button" class="btn btn-primary" id="saveSettingsBtn"><span style="color: white;"><i class="iconfont icon-save-3-fill"></i> 保存设置</span></button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- 确认删除模态框 -->
    <div class="modal fade" id="deleteDomainModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">确认删除</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>确定要删除域名 <span id="deleteModalDomainName"></span> 吗？此操作不可撤销。</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"><span style="color: white;"><i class="iconfont icon-xmark"></i> 取消</span></button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteBtn"><span style="color: white;"><i class="iconfont icon-shanchu"></i> 删除</span></button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- 续期模态框 -->
    <div class="modal fade" id="renewDomainModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">域名续期</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>为域名 <span id="renewModalDomainName"></span> 续期</p>
                    <div class="mb-3">
                        <label for="renewPeriod" class="form-label"><i class="iconfont icon-repeat"></i> 续期周期</label>
                        <div class="input-group">
                            <input type="number" class="form-control" id="renewPeriodValue" min="1" max="100" value="1">
                            <select class="form-select" id="renewPeriodUnit">
                                <option value="year" selected>年</option>
                                <option value="month">月</option>
                                <option value="day">日</option>
                            </select>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="newExpiryDate" class="form-label"><i class="iconfont icon-calendar-days"></i> 新到期日期</label>
                        <input type="date" class="form-control" id="newExpiryDate" readonly>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"><i class="iconfont icon-xmark"></i> 取消</button>
                    <button type="button" class="btn btn-success" id="confirmRenewBtn"><i class="iconfont icon-arrows-rotate"></i> 确认续期</button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <!-- 已在头部引入iconfont图标库，此处无需重复引入 -->
    <script>
        // 全局变量
        let domains = [];
        let currentDomainId = null;
        let telegramConfig = {};
        let currentSortField = 'suffix'; // 默认排序字段改为域名后缀
        let currentSortOrder = 'asc'; // 默认排序顺序
        let viewMode = 'auto-collapse'; // 默认查看模式：auto-collapse (自动折叠), expand-all (全部展开), collapse-all (全部折叠)
        
        // 将天数转换为年月日格式
        function formatDaysToYMD(days) {
          if (days <= 0) return '';
          
          const years = Math.floor(days / 365);
          const remainingDaysAfterYears = days % 365;
          const months = Math.floor(remainingDaysAfterYears / 30);
          const remainingDays = remainingDaysAfterYears % 30;
          
          let result = '';
          
          if (years > 0) {
            result += years + '年';
          }
          
          if (months > 0) {
            result += months + '个月';
          }
          
          if (remainingDays > 0) {
            result += remainingDays + '天';
          }
          
          return result;
        }
        
        // 页面加载完成后执行
        document.addEventListener('DOMContentLoaded', () => {
            // 设置事件监听器
            setupEventListeners();
            
            // 确保DOM元素已完全加载
            setTimeout(() => {
                // 使用Promise.all并行加载数据
                Promise.all([loadDomains(), loadTelegramConfig()])
                    .catch(error => console.error('数据加载错误:', error));
            }, 300);
            
            // 设置初始视图模式为全部折叠
            setTimeout(() => {
                const collapseAllButton = document.querySelector('.view-option[data-view="collapse-all"]');
                if (collapseAllButton) {
                    collapseAllButton.classList.remove('btn-outline-info');
                    collapseAllButton.classList.add('btn-info');
                }
            }, 500); // 延迟执行确保DOM已经加载完成
        });
        
        // 设置事件监听器
        function setupEventListeners() {
            // Logo点击刷新页面
            document.getElementById('refreshLogo').addEventListener('click', function() {
                // 添加刷新动画效果
                const logoImg = this.querySelector('.logo-img');
                logoImg.classList.add('refreshing');
                
                // 延迟刷新页面，让用户看到动画效果
                setTimeout(() => {
                    window.location.reload();
                }, 300);
            });
            
            // 保存域名按钮
            document.getElementById('saveDomainBtn').addEventListener('click', saveDomain);
            
            // 确认删除按钮
            document.getElementById('confirmDeleteBtn').addEventListener('click', deleteDomain);
            
            // 确认续期按钮
            document.getElementById('confirmRenewBtn').addEventListener('click', renewDomain);
            
            // 添加域名按钮点击事件 - 清空表单
            document.querySelector('.add-domain-btn').addEventListener('click', function() {
                resetForm(); // 重置表单，确保显示空白表单
            });
            
            // 清除上次续期时间按钮
            document.getElementById('clearLastRenewed').addEventListener('click', function() {
                document.getElementById('lastRenewed').value = '';
                document.getElementById('lastRenewedDisplay').textContent = '已清除';
                document.getElementById('lastRenewedDisplay').classList.add('text-danger');
                
                // 清除上次续期时间后，重新根据注册时间和续期周期计算到期日期
                calculateExpiryDate();
            });
            
            // 续期值或单位变化时更新新到期日期
            document.getElementById('renewPeriodValue').addEventListener('input', updateNewExpiryDate);
            document.getElementById('renewPeriodUnit').addEventListener('change', updateNewExpiryDate);
            
            // 注册时间和续期周期变化时自动计算到期日期
            document.getElementById('registrationDate').addEventListener('change', calculateExpiryDate);
            document.getElementById('renewCycleValue').addEventListener('input', calculateExpiryDate);
            document.getElementById('renewCycleUnit').addEventListener('change', calculateExpiryDate);
            
            // Telegram启用状态变化
            document.getElementById('telegramEnabled').addEventListener('change', function() {
                document.getElementById('telegramSettings').style.display = this.checked ? 'block' : 'none';
            });
            
            // 保存设置按钮
            document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
            
            // 测试Telegram按钮
            document.getElementById('testTelegramBtn').addEventListener('click', testTelegram);
            
            // 域名通知设置 - 全局/自定义切换
            document.getElementById('useGlobalSettings').addEventListener('change', function() {
                document.getElementById('domainNotifySettings').style.display = this.checked ? 'none' : 'block';
            });
            
            // 根据注册时间和续期周期自动计算到期日期
            function calculateExpiryDate() {
                const registrationDate = document.getElementById('registrationDate').value;
                const lastRenewed = document.getElementById('lastRenewed').value;
                const renewCycleValue = parseInt(document.getElementById('renewCycleValue').value) || 1;
                const renewCycleUnit = document.getElementById('renewCycleUnit').value;
                
                if (!registrationDate) {
                    // 如果没有注册时间，清空到期日期
                    document.getElementById('expiryDate').value = '';
                    return;
                }
                
                // 如果有上次续期时间，则从上次续期时间开始计算；否则从注册时间开始计算
                const baseDate = lastRenewed ? new Date(lastRenewed) : new Date(registrationDate);
                const expiryDate = new Date(baseDate);
                
                // 根据续期周期单位计算到期日期
                switch(renewCycleUnit) {
                    case 'year':
                        expiryDate.setFullYear(baseDate.getFullYear() + renewCycleValue);
                        break;
                    case 'month':
                        expiryDate.setMonth(baseDate.getMonth() + renewCycleValue);
                        break;
                    case 'day':
                        expiryDate.setDate(baseDate.getDate() + renewCycleValue);
                        break;
                }
                
                // 格式化日期为 YYYY-MM-DD 格式
                const formattedDate = expiryDate.toISOString().split('T')[0];
                document.getElementById('expiryDate').value = formattedDate;
            }
            
            // 监听备注文本和颜色变化
            document.getElementById('customNote').addEventListener('input', updateNotePreview);
            document.getElementById('noteColor').addEventListener('change', updateNotePreview);
            
            // 当模态框显示时初始化预览
            document.getElementById('addDomainModal').addEventListener('shown.bs.modal', function() {
                updateNotePreview();
            });
            
            // 排序选项点击事件
            document.querySelectorAll('.sort-option').forEach(option => {
                option.addEventListener('click', function(e) {
                    e.preventDefault();
                    currentSortField = this.dataset.sort;
                    currentSortOrder = this.dataset.order;
                    renderDomainList();
                    
                                // 不再更新排序按钮文本，只保留"域名排序"
            // 但仍然需要更新勾选状态
                    
                    // 更新勾选状态
                    document.querySelectorAll('.sort-option').forEach(opt => {
                        opt.classList.remove('active');
                    });
                    this.classList.add('active');
                });
            });
            
            // 视图模式选项点击事件
            document.querySelectorAll('.view-option').forEach(option => {
                option.addEventListener('click', function(e) {
                    const newViewMode = this.dataset.view;
                    
                    // 设置视图模式
                    viewMode = newViewMode;
                    
                    // 直接获取所有卡片详情元素
                    const allDetails = document.querySelectorAll('.domain-card .collapse');
                    
                    // 根据模式直接进行操作
                    if (newViewMode === 'expand-all') {
                        // 直接展开所有卡片
                        allDetails.forEach(detail => {
                            // 手动添加show类，强制显示
                            detail.classList.add('show');
                            detail.style.height = 'auto'; // 确保内容显示
                            detail.style.overflow = 'visible';
                            
                            // 获取父级卡片
                            const domainCard = detail.closest('.domain-card');
                            if (domainCard) {
                                // 在父级卡片中寻找toggle按钮
                                const btn = domainCard.querySelector('.toggle-details');
                                if (btn) {
                                    btn.classList.remove('collapsed');
                                    btn.setAttribute('aria-expanded', 'true');
                                }
                                // 添加展开状态类，使域名可以换行显示
                                domainCard.classList.add('expanded');
                            }
                        });
                        
                        // 高亮"全部展开"按钮
                        document.querySelectorAll('.view-option').forEach(btn => {
                            if (btn.dataset.view === 'expand-all') {
                                btn.classList.remove('btn-outline-info');
                                btn.classList.add('btn-info');
                            } else {
                                btn.classList.add('btn-outline-info');
                                btn.classList.remove('btn-info');
                            }
                        });
                    } else if (newViewMode === 'collapse-all' || newViewMode === 'auto-collapse') {
                        // 直接折叠所有卡片
                        allDetails.forEach(detail => {
                            // 手动移除show类，强制隐藏
                            detail.classList.remove('show');
                            detail.style.height = '0px'; // 强制隐藏高度
                            detail.style.overflow = 'hidden';
                            
                            // 获取父级卡片
                            const domainCard = detail.closest('.domain-card');
                            if (domainCard) {
                                // 在父级卡片中寻找toggle按钮
                                const btn = domainCard.querySelector('.toggle-details');
                                if (btn) {
                                    btn.classList.add('collapsed');
                                    btn.setAttribute('aria-expanded', 'false');
                                }
                                // 移除展开状态类，恢复省略号显示
                                domainCard.classList.remove('expanded');
                            }
                        });
                        
                        // 高亮"全部折叠"按钮
                        document.querySelectorAll('.view-option').forEach(btn => {
                            if (btn.dataset.view === 'collapse-all') {
                                btn.classList.remove('btn-outline-info');
                                btn.classList.add('btn-info');
                            } else {
                                btn.classList.add('btn-outline-info');
                                btn.classList.remove('btn-info');
                            }
                        });
                    }
                });
            });
            
            // 添加点击空白处折叠卡片的功能
            document.addEventListener('click', function(e) {
                // 检查是否处于"折叠"模式
                const collapseButton = document.querySelector('.view-option[data-view="collapse-all"]');
                if (collapseButton && collapseButton.classList.contains('btn-info')) {
                    // 确保点击的是空白处，而不是卡片内部或其他功能按钮
                    if (
                        !e.target.closest('.domain-card') && 
                        !e.target.closest('.btn') && 
                        !e.target.closest('.modal') && 
                        !e.target.closest('.navbar') &&
                        !e.target.closest('.page-header') &&
                        !e.target.closest('.dropdown-menu')
                    ) {
                        // 获取所有展开的卡片
                        const expandedCards = document.querySelectorAll('.domain-card .collapse.show');
                        
                        // 折叠所有展开的卡片
                        expandedCards.forEach(detail => {
                            // 使用Bootstrap的collapse方法实现平滑的折叠动画
                            const bsCollapse = bootstrap.Collapse.getInstance(detail);
                            if (bsCollapse) {
                                bsCollapse.hide();
                            }
                            
                            // 获取父级卡片
                            const domainCard = detail.closest('.domain-card');
                            if (domainCard) {
                                // 监听折叠完成事件，移除展开状态类
                                detail.addEventListener('hidden.bs.collapse', function() {
                                    // 移除展开状态类，恢复省略号显示
                                    domainCard.classList.remove('expanded');
                                }, {once: true}); // 只执行一次
                                
                                // 在父级卡片中寻找toggle按钮并更新状态
                                const btn = domainCard.querySelector('.toggle-details');
                                if (btn) {
                                    btn.classList.add('collapsed');
                                    btn.setAttribute('aria-expanded', 'false');
                                }
                            }
                        });
                    }
                }
            });
            
            // 初始加载时设置默认排序选项
            const defaultSortOption = document.querySelector('.sort-option[data-sort="' + currentSortField + '"][data-order="' + currentSortOrder + '"]');
            if (defaultSortOption) {
                // 不再更新排序按钮文本，保持"域名排序"
                
                // 设置默认选项为激活状态
                defaultSortOption.classList.add('active');
            } else {
                // 如果找不到匹配的选项，默认选择按后缀升序
                const suffixAscOption = document.querySelector('.sort-option[data-sort="suffix"][data-order="asc"]');
                if (suffixAscOption) {
                    suffixAscOption.classList.add('active');
                    currentSortField = 'suffix';
                    currentSortOrder = 'asc';
                }
            }
            
            // 表头排序点击事件
            document.addEventListener('click', function(e) {
                if (e.target.tagName === 'TH') {
                    const field = e.target.dataset.sort;
                    if (field) {
                        if (currentSortField === field) {
                            // 切换排序顺序
                            currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
                        } else {
                            currentSortField = field;
                            currentSortOrder = 'asc';
                        }
                        renderDomainList();
                    }
                }
            });
        }
        
        // 自定义备注颜色预览函数
        function updateNotePreview() {
            const noteText = document.getElementById('customNote').value.trim();
            const noteColor = document.getElementById('noteColor').value;
            const notePreview = document.getElementById('notePreview');
            
            if (noteText) {
                // 更新预览文字和显示状态
                notePreview.textContent = noteText;
                notePreview.style.display = 'inline-block';
                
                // 移除所有颜色类但保留基本样式
                notePreview.className = 'text-info note-preview';
                // 添加选中的颜色类
                notePreview.classList.add(noteColor);
                
                // 使用内联样式强制设置颜色
                const colorMap = {
                    'tag-blue': '#3B82F6',
                    'tag-green': '#10B981',
                    'tag-red': '#EF4444',
                    'tag-yellow': '#F59E0B',
                    'tag-purple': '#8B5CF6',
                    'tag-pink': '#EC4899',
                    'tag-indigo': '#6366F1',
                    'tag-gray': '#6B7280'
                };
                notePreview.style.backgroundColor = colorMap[noteColor] || '#3B82F6';
            } else {
                notePreview.style.display = 'none';
            }
        }
        
        // 加载所有域名
        async function loadDomains() {
            // 先尝试显示加载状态，但不阻止后续操作
            try {
                showDomainLoadingState();
            } catch (loadingError) {
                console.error('显示加载状态失败:', loadingError);
                // 继续执行，不要因为显示加载状态失败而中断
            }
            
            try {
                const response = await fetch('/api/domains');
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API响应错误:', response.status, errorText);
                    throw new Error('获取域名列表失败: ' + response.status);
                }
                
                domains = await response.json();
                
                // 确保DOM元素已加载后再渲染
                setTimeout(() => {
                    renderDomainList();
                }, 100);
                
                return domains; // 返回加载的域名数据
            } catch (error) {
                console.error('加载域名数据失败:', error);
                showAlert('danger', '加载域名列表失败: ' + error.message);
                throw error; // 重新抛出错误以便Promise.all可以捕获
            }
        }
        
        // 显示域名加载中的状态
        function showDomainLoadingState() {
            // 使用document.querySelector作为备选方法
            const domainListContainer = document.getElementById('domainListContainer') || document.querySelector('#domainListContainer');
            
            if (!domainListContainer) {
                return;
            }
            
            try {
                // 创建骨架屏
                domainListContainer.innerHTML = 
                    '<div class="col-md-6 col-lg-4 domain-column px-1-5">' +
                        generateSkeletonCard() +
                        generateSkeletonCard() +
                    '</div>' +
                    '<div class="col-md-6 col-lg-4 domain-column px-1-5">' +
                        generateSkeletonCard() +
                        generateSkeletonCard() +
                    '</div>' +
                    '<div class="col-md-6 col-lg-4 domain-column px-1-5">' +
                        generateSkeletonCard() +
                        generateSkeletonCard() +
                    '</div>';
            } catch (error) {
                console.error('设置骨架屏失败:', error);
            }
        }
        
        // 生成骨架屏卡片
        function generateSkeletonCard() {
            return '<div class="domain-card skeleton-card mb-3">' +
                '<div class="domain-header skeleton-header">' +
                    '<div class="skeleton-text-lg"></div>' +
                    '<div class="skeleton-text-sm"></div>' +
                '</div>' +
                '<div class="domain-body">' +
                    '<div class="skeleton-text"></div>' +
                    '<div class="skeleton-text"></div>' +
                    '<div class="skeleton-progress"></div>' +
                '</div>' +
            '</div>';
        }
        
        // 加载Telegram配置
        async function loadTelegramConfig() {
            try {
                const response = await fetch('/api/telegram/config');
                if (!response.ok) throw new Error('获取Telegram配置失败');
                
                telegramConfig = await response.json();
                
                // 更新表单
                document.getElementById('telegramEnabled').checked = telegramConfig.enabled;
                document.getElementById('telegramSettings').style.display = telegramConfig.enabled ? 'block' : 'none';
                document.getElementById('notifyDays').value = telegramConfig.notifyDays || 30;
                
                // 处理聊天ID的显示
                if (telegramConfig.chatIdFromEnv) {
                    // 如果聊天ID来自环境变量，显示固定文本
                    document.getElementById('telegramChatId').value = '';
                    document.getElementById('telegramChatId').placeholder = '已通过环境变量配置';
                    document.getElementById('telegramChatId').disabled = false; // 允许用户编辑
                } else {
                    // 显示用户设置的聊天ID
                    document.getElementById('telegramChatId').value = telegramConfig.chatId || '';
                    document.getElementById('telegramChatId').placeholder = '如已在环境变量中配置则可留空';
                    document.getElementById('telegramChatId').disabled = false;
                }
                
                // 处理Token的显示
                if (telegramConfig.tokenFromEnv) {
                    // 如果Token来自环境变量，显示固定文本
                    document.getElementById('telegramToken').value = '';
                    document.getElementById('telegramToken').placeholder = '已通过环境变量配置';
                    document.getElementById('telegramToken').disabled = false; // 允许用户编辑
                } else {
                    // 显示用户设置的Token
                    document.getElementById('telegramToken').value = telegramConfig.botToken || '';
                    document.getElementById('telegramToken').placeholder = '如已在环境变量中配置则可留空';
                    document.getElementById('telegramToken').disabled = false;
                }
            } catch (error) {
                console.error('加载Telegram配置失败:', error);
            }
        }
        
        // 保存设置
        async function saveSettings() {
            const enabled = document.getElementById('telegramEnabled').checked;
            // 获取表单值，即使是空字符串也保留
            const botToken = document.getElementById('telegramToken').value;
            const chatId = document.getElementById('telegramChatId').value;
            const notifyDays = parseInt(document.getElementById('notifyDays').value) || 30;
            
            try {
                const response = await fetch('/api/telegram/config', {
                    headers: { 'Content-Type': 'application/json' },
                    method: 'POST',
                    body: JSON.stringify({
                        enabled,
                        botToken,
                        chatId,
                        notifyDays
                    })
                });
                
                if (!response.ok) {
                    try {
                        const error = await response.json();
                        throw new Error(error.error || '保存设置失败');
                    } catch (jsonError) {
                        // 如果响应不是JSON格式，直接使用状态文本
                        throw new Error('保存设置失败: ' + response.statusText);
                    }
                }
                
                telegramConfig = await response.json();
                showAlert('success', '设置保存成功');
                
                // 关闭模态框
                bootstrap.Modal.getInstance(document.getElementById('settingsModal')).hide();
            } catch (error) {
                showAlert('danger', error.message);
            }
        }
        
        // 测试Telegram通知
        async function testTelegram() {
            const testResult = document.getElementById('testResult');
            testResult.textContent = '发送中...';
            testResult.className = 'ms-2 text-info';
            
            try {
                const response = await fetch('/api/telegram/test', {
                    method: 'POST'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || '测试失败');
                }
                
                const result = await response.json();
                testResult.textContent = '测试成功！请检查Telegram是否收到消息';
                testResult.className = 'ms-2 telegram-test-success';
            } catch (error) {
                testResult.textContent = '测试失败: ' + error.message;
                testResult.className = 'ms-2 text-danger';
            }
        }
        
        // 渲染域名列表
        function renderDomainList() {
            // 获取domainListContainer
            const domainListContainer = document.getElementById('domainListContainer');
            if (!domainListContainer) {
                return;
            }
            
            if (domains.length === 0) {
                // 显示无域名记录提示
                domainListContainer.innerHTML = '<div class="col-12"><div class="alert alert-info">暂无域名记录，请点击右上角按钮添加域名。</div></div>';
                return;
            }
            
            // 清空容器
            domainListContainer.innerHTML = '';
            
            // 获取全局通知设置
            const globalNotifyDays = telegramConfig.notifyDays || 30;
            
            // 计算每个域名的剩余天数
            domains.forEach(domain => {
                const expiryDate = new Date(domain.expiryDate);
                const today = new Date();
                domain.daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            });
            
            // 按照指定字段和顺序排序
            sortDomains(domains, currentSortField, currentSortOrder);
            
                // 按注册商分组域名
    const domainGroups = {};
    
    // 创建默认分类
    domainGroups['默认分类'] = [];
    
    // 将域名分配到不同的分组
    domains.forEach(domain => {
        if (domain.registrar && domain.registrar.trim() !== '') {
            // 如果有注册商信息，添加到对应分组
            if (!domainGroups[domain.registrar]) {
                domainGroups[domain.registrar] = [];
            }
            domainGroups[domain.registrar].push(domain);
        } else {
            // 没有注册商信息的域名放入默认分类
            domainGroups['默认分类'].push(domain);
        }
    });
            
            // 处理域名分组
            const renderGroup = (groupName, groupDomains) => {
                // 如果该分组没有域名，跳过
                if (groupDomains.length === 0) return;
                
                // 创建分类容器，用于包含标题和卡片
                const groupContainer = document.createElement('div');
                groupContainer.className = 'domain-group-container'; // 移除mb-4类，使用CSS中定义的margin
                domainListContainer.appendChild(groupContainer);
                
                // 创建分类标题行
                const categoryRow = document.createElement('div');
                categoryRow.className = 'row'; // 移除额外的margin类
                categoryRow.innerHTML = 
                    '<div class="col-12 px-1-5">' + /* 添加与卡片列相同的内边距类 */
                        '<div class="category-header">' +
                            '<h5 class="category-title">' + groupName + '</h5>' +
                        '</div>' +
                    '</div>';
                groupContainer.appendChild(categoryRow);
                
                // 创建域名卡片行容器
                const domainsRow = document.createElement('div');
                domainsRow.className = 'row g-2';
                groupContainer.appendChild(domainsRow);
                
                // 创建三列布局
                const column1 = document.createElement('div');
                const column2 = document.createElement('div');
                const column3 = document.createElement('div');
                column1.className = 'col-md-6 col-lg-4 domain-column px-1-5';
                column2.className = 'col-md-6 col-lg-4 domain-column px-1-5';
                column3.className = 'col-md-6 col-lg-4 domain-column px-1-5';
                domainsRow.appendChild(column1);
                domainsRow.appendChild(column2);
                domainsRow.appendChild(column3);
                
                // 为每个域名创建卡片，并按列分配
                groupDomains.forEach((domain, index) => {
                    // 决定将卡片放入哪一列
                    const columnIndex = index % 3;
                    const targetColumn = columnIndex === 0 ? column1 : (columnIndex === 1 ? column2 : column3);
                    // 创建卡片容器
                    const domainCard = document.createElement('div');
                    domainCard.className = 'mb-2'; // 简化类名，不再需要列类
                    
                    const daysLeft = domain.daysLeft;
                    
                    // 确保通知设置存在
                    if (!domain.notifySettings) {
                        domain.notifySettings = { useGlobalSettings: true, enabled: true, notifyDays: 30 };
                    }
                    
                    // 获取该域名的通知设置
                    const notifySettings = domain.notifySettings;
                    const notifyDays = notifySettings.useGlobalSettings ? globalNotifyDays : notifySettings.notifyDays;
                    
                    // 状态标签逻辑
                    let statusClass = 'safe';
                    let statusText = '<i class="iconfont icon-circle-check"></i> 正常';
                    let statusBadge = 'success';
                    
                    // 进度条颜色逻辑（先初始化，后面根据百分比设置）
                    let progressColor = 'rgba(0, 255, 76, 0.9)'; // 默认绿色
                    
                    // 设置状态标签
                    if (daysLeft <= 0) {
                        statusClass = 'expired';
                        statusText = '<i class="iconfont icon-triangle-exclamation"></i> 已过期';
                        statusBadge = 'danger';
                    } else if (daysLeft <= 30) {  // 修改为固定30天，按需求调整
                        statusClass = 'warning';
                        statusText = '<i class="iconfont icon-bullhorn"></i> 即将到期';
                        statusBadge = 'warning';
                    }
                    
                    // 计算域名有效期的百分比进度
                    let progressPercent = 0;
                    
                    // 获取域名的续期周期设置，如果没有则使用默认值（1年）
                    let cycleDays = 365; // 默认为1年
                    
                    if (domain.renewCycle) {
                        // 根据续期周期单位计算天数
                        switch(domain.renewCycle.unit) {
                            case 'year':
                                cycleDays = domain.renewCycle.value * 365;
                                break;
                            case 'month':
                                // 更精确地计算月份的实际天数
                                if (domain.renewCycle.value === 1) {
                                    const currentDate = new Date(domain.expiryDate);
                                    const nextMonth = new Date(currentDate);
                                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                                    cycleDays = Math.round((nextMonth - currentDate) / (1000 * 60 * 60 * 24));
                                } else {
                                    const currentDate = new Date(domain.expiryDate);
                                    const futureDate = new Date(currentDate);
                                    futureDate.setMonth(futureDate.getMonth() + domain.renewCycle.value);
                                    cycleDays = Math.round((futureDate - currentDate) / (1000 * 60 * 60 * 24));
                                }
                                break;
                            case 'day':
                                cycleDays = domain.renewCycle.value;
                                break;
                            default:
                                cycleDays = 365;
                        }
                    }
                    
                    // 简化进度条计算逻辑
                    if (daysLeft <= 0) {
                        // 已过期域名，但如果有lastRenewed字段，说明已续期
                        if (domain.lastRenewed) {
                            const today = new Date();
                            const expiryDate = new Date(domain.expiryDate);
                            const newDaysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                            
                            if (newDaysLeft >= cycleDays) {
                                progressPercent = 100;
                            } else {
                                // 使用精确计算，不进行四舍五入，保留整数部分
                                progressPercent = Math.floor((newDaysLeft / cycleDays) * 100);
                            }
                        } else {
                            progressPercent = 0;
                        }
                    } else {
                        // 未过期域名
                        if (daysLeft >= cycleDays) {
                            progressPercent = 100;
                        } else {
                            // 使用精确计算，不进行四舍五入，保留整数部分
                            progressPercent = Math.floor((daysLeft / cycleDays) * 100);
                        }
                    }
                    
                    // 确保进度百分比在0-100范围内
                    if (progressPercent < 0) progressPercent = 0;
                    if (progressPercent > 100) progressPercent = 100;
                    
                    // 根据百分比设置进度条颜色
                    if (progressPercent < 10) {
                        progressColor = 'rgba(231, 18, 64, 0.9)'; // 小于10%显示红色
                    } else if (progressPercent < 30) {
                        progressColor = 'rgba(255, 208, 0, 0.9)'; // 10%-30%显示黄色
                    } else {
                        progressColor = 'rgba(0, 255, 76, 0.9)'; // 大于30%显示绿色
                    }
                    
                    // 创建圆环进度条样式
                    let progressCircleHtml = '';
                    
                    // 使用SVG实现圆环进度条
                    const radius = 28; // 略小的圆环半径，确保不会太接近边缘
                    const circumference = 2 * Math.PI * radius; // 圆环周长
                    const offset = circumference - (progressPercent / 100) * circumference; // 计算偏移量
                    
                    // 创建SVG圆环进度条，增加SVG尺寸
                    const svgSize = 65; // SVG容器大小
                    const svgCenter = svgSize / 2; // 居中
                    
                    // SVG圆环和百分比分开处理
                    const percentText = progressPercent + '%';
                    
                    if (daysLeft <= 0) {
                        // 已过期域名显示简化的进度条，但保留0%文本
                        progressCircleHtml = 
                            '<div style="position:relative; width:' + svgSize + 'px; height:' + svgSize + 'px;">' +
                            '<svg class="progress-ring" width="' + svgSize + '" height="' + svgSize + '" viewBox="0 0 ' + svgSize + ' ' + svgSize + '">' +
                            '<circle class="progress-ring-circle-bg" stroke="#f5f5f5" stroke-width="6" fill="transparent" r="' + radius + '" cx="' + svgCenter + '" cy="' + svgCenter + '"/>' +
                            '</svg>' +
                            '<div style="position:absolute; top:0; left:0; right:0; bottom:0; display:flex; align-items:center; justify-content:center; z-index:9999;">' +
                            '<span class="progress-percent-text">0%</span>' +
                            '</div>' +
                            '</div>';
                    } else {
                        // 正常域名显示完整进度条
                        progressCircleHtml = 
                            '<div style="position:relative; width:' + svgSize + 'px; height:' + svgSize + 'px;">' +
                            '<svg class="progress-ring" width="' + svgSize + '" height="' + svgSize + '" viewBox="0 0 ' + svgSize + ' ' + svgSize + '">' +
                            '<circle class="progress-ring-circle-bg" stroke="#f5f5f5" stroke-width="6" fill="transparent" r="' + radius + '" cx="' + svgCenter + '" cy="' + svgCenter + '"/>' +
                            '<circle class="progress-ring-circle" stroke="' + progressColor + '" stroke-width="6" fill="transparent" ' +
                            'stroke-dasharray="' + circumference + ' ' + circumference + '" ' +
                            'style="stroke-dashoffset:' + offset + 'px;" ' +
                            'r="' + radius + '" cx="' + svgCenter + '" cy="' + svgCenter + '"/>' +
                            '</svg>' +
                            '<div style="position:absolute; top:0; left:0; right:0; bottom:0; display:flex; align-items:center; justify-content:center; z-index:9999;">' +
                            '<span class="progress-percent-text">' + percentText + '</span>' +
                            '</div>' +
                            '</div>';
                    }
                    
                    // 准备通知信息和上次续期信息
                    let infoHtml = '';
                    
                    // 添加自定义通知信息
                    if (!notifySettings.useGlobalSettings) {
                        infoHtml += '<small class="text-white d-inline-block me-3">' + 
                            (notifySettings.enabled ? '自定义通知: ' + notifySettings.notifyDays + '天' : '通知已禁用') + 
                            '</small>';
                    }
                    
                    // 添加上次续期信息
                    if (domain.lastRenewed) {
                        infoHtml += '<small class="text-white d-inline-block">上次续期: ' + formatDate(domain.lastRenewed) + '</small>';
                    }
                    
                    // 生成价格信息HTML
                    let priceHtml = '';
                    if (domain.price && domain.price.value !== null && domain.price.value !== undefined && domain.price.value !== '') {
                        priceHtml = ' <span class="text-white-50">(' + domain.price.currency + domain.price.value + 
                        '/' + (domain.price.unit === 'year' ? '年' : domain.price.unit === 'month' ? '月' : '日') + 
                        ')</span>';
                    }
                    
                                    const cardHtml = '<div class="card domain-card ' + statusClass + ' mb-2">' +
                '<div class="card-header">' +
                '<span class="status-dot ' + statusClass + '"></span>' +
                '<div class="domain-header">' +
                (domain.customNote && domain.customNote.trim() !== '' ? 
                    // 有备注时的布局 - 标签在域名下方
                    '<div class="domain-name-container" style="display: flex; flex-direction: column; justify-content: flex-start; height: 100%;">' +
                    '<h5 class="mb-0 domain-title" style="word-break: break-all;"><span class="domain-text" style="line-height: var(--domain-line-height);">' + domain.name + '</span></h5>' +
                    '<div class="spacer" style="height: var(--domain-note-spacing);"></div>' +
                    '<div class="domain-meta">' +
                                                    '<span class="text-info ' + (domain.noteColor || 'tag-blue') + '" style="background-color: ' + 
                                (domain.noteColor === 'tag-blue' ? '#3B82F6' : 
                                domain.noteColor === 'tag-green' ? '#10B981' :
                                domain.noteColor === 'tag-red' ? '#EF4444' : 
                                domain.noteColor === 'tag-yellow' ? '#F59E0B' :
                                domain.noteColor === 'tag-purple' ? '#8B5CF6' :
                                domain.noteColor === 'tag-pink' ? '#EC4899' :
                                domain.noteColor === 'tag-indigo' ? '#6366F1' :
                                domain.noteColor === 'tag-gray' ? '#6B7280' : '#3B82F6') + 
                                ' !important">' + domain.customNote + '</span>' +
                    '</div>' +
                    '</div>'
                    : 
                    // 无备注时的布局 - 保持与有备注布局相同的结构，只是没有备注标签
                    '<div class="domain-name-container" style="display: flex; flex-direction: column; justify-content: flex-start; height: 100%;">' +
                    '<h5 class="mb-0 domain-title" style="word-break: break-all;"><span class="domain-text" style="line-height: var(--domain-line-height);">' + domain.name + '</span></h5>' +
                    '<div class="spacer" style="height: var(--domain-note-spacing);"></div>' +
                    '<div class="domain-meta"></div>' +
                    '</div>'
                ) +
                '</div>' +
                        '<div class="domain-status">' +
                        '<span class="badge bg-' + statusBadge + '">' + statusText + '</span>' +
                        '<button class="btn btn-sm btn-link toggle-details collapsed" data-bs-toggle="collapse" data-bs-target="#details-' + domain.id + '" aria-expanded="false" aria-controls="details-' + domain.id + '">' +
                        '<span class="toggle-icon-container">' +
                        '<i class="iconfont icon-angle-down toggle-icon"></i>' +
                        '</span>' +
                        '</button>' +
                        '</div>' +
                        '</div>' +
                        '<div class="collapse" id="details-' + domain.id + '">' +
                        '<div class="card-body pb-2">' +
                        '<div class="d-flex justify-content-between align-items-start mb-2" style="position: relative;">' +
                        '<div class="flex-grow-1" style="padding-right: 75px;">' +
                        (domain.registrationDate ? '<p class="card-text mb-1 text-nowrap" style="overflow: hidden; text-overflow: ellipsis;"><i class="iconfont icon-calendar-days"></i><strong>注册时间:</strong>' + formatDate(domain.registrationDate) + '</p>' : '') +
                        '<p class="card-text mb-1 text-nowrap" style="overflow: hidden; text-overflow: ellipsis;"><i class="iconfont icon-rili"></i><strong>到期日期:</strong>' + formatDate(domain.expiryDate) + '</p>' +
                        '<p class="card-text mb-1 text-nowrap" style="overflow: hidden; text-overflow: ellipsis;"><i class="iconfont icon-repeat"></i><strong>续期周期:</strong>' + 
                        (domain.renewCycle ? domain.renewCycle.value + ' ' + 
                        (domain.renewCycle.unit === 'year' ? '年' : 
                         domain.renewCycle.unit === 'month' ? '月' : '天') : '1 年') + 
                        priceHtml + '</p>' +
                        '<p class="card-text mb-0 text-nowrap" style="overflow: hidden; text-overflow: ellipsis;"><i class="iconfont icon-hourglass-start"></i><strong>剩余天数:</strong>' + (daysLeft > 0 ? daysLeft + ' 天 <span class="text-white-50">(' + formatDaysToYMD(daysLeft) + ')</span>' : '已过期') + '</p>' +
                        '</div>' +
                        '<div class="progress-circle-container">' +
                        '<div class="progress-circle">' +
                        progressCircleHtml +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        (infoHtml ? '<div class="domain-info mb-2">' + infoHtml + '</div>' : '') +
                        '<div class="domain-actions">' +
                        '<!-- 编辑按钮 -->' +
                        '<button class="btn btn-sm btn-primary edit-domain" data-id="' + domain.id + '" title="编辑域名"><i class="iconfont icon-pencil"></i> 编辑</button>' +
                        '<!-- 续期按钮 -->' +
                        '<button class="btn btn-sm btn-success renew-domain" data-id="' + domain.id + '" data-name="' + domain.name + '" data-expiry="' + domain.expiryDate + '" title="续期域名"><i class="iconfont icon-arrows-rotate"></i> 续期</button>' +
                        '<!-- 测试按钮 -->' +
                        '<button class="btn btn-sm btn-info test-domain-notify" data-id="' + domain.id + '" title="测试通知"><i class="iconfont icon-paper-plane"></i> 测试</button>' +
                        '<!-- 续期链接按钮 -->' +
                        (domain.renewLink ? 
                        '<a href="' + domain.renewLink + '" target="_blank" class="btn btn-sm btn-warning" title="前往续期页面"><i class="iconfont icon-link"></i> 链接</a>' : 
                        '<button class="btn btn-sm btn-secondary" disabled title="未设置续期链接"><i class="iconfont icon-link"></i> 链接</button>') +
                        '<!-- 删除按钮 -->' +
                        '<button class="btn btn-sm btn-danger delete-domain" data-id="' + domain.id + '" data-name="' + domain.name + '" title="删除域名"><i class="iconfont icon-shanchu"></i> 删除</button>' +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '</div>';
                    domainCard.innerHTML = cardHtml;
                    
                    // 将卡片添加到对应的列中
                    targetColumn.appendChild(domainCard);
                });
            };
            
                // 首先处理默认分类
    if (domainGroups['默认分类'] && domainGroups['默认分类'].length > 0) {
        renderGroup('默认分类', domainGroups['默认分类']);
        delete domainGroups['默认分类'];
    }
    
    // 去除emoji的函数
    function removeEmoji(str) {
        // 匹配emoji的正则表达式
        // 这个正则表达式匹配大多数常见的emoji
        return str.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
    }
    
    // 然后处理其他分类（按名称升序排列，忽略emoji）
    const sortedGroupNames = Object.keys(domainGroups).sort((a, b) => {
        // 去除emoji后再进行比较
        const aNoEmoji = removeEmoji(a).trim().toLowerCase();
        const bNoEmoji = removeEmoji(b).trim().toLowerCase();
        
        // 使用localeCompare进行字符串比较，确保正确处理各种语言字符
        return aNoEmoji.localeCompare(bNoEmoji, 'en');
    });
    
    // 按排序后的顺序渲染其他分类
    for (const groupName of sortedGroupNames) {
        renderGroup(groupName, domainGroups[groupName]);
    }
            
            // 添加事件监听器
            document.querySelectorAll('.edit-domain').forEach(button => {
                button.addEventListener('click', () => editDomain(button.dataset.id));
            });
            
            document.querySelectorAll('.delete-domain').forEach(button => {
                button.addEventListener('click', () => showDeleteModal(button.dataset.id, button.dataset.name));
            });
            
            document.querySelectorAll('.renew-domain').forEach(button => {
                button.addEventListener('click', () => showRenewModal(button.dataset.id, button.dataset.name, button.dataset.expiry));
            });
            
            // 添加测试通知按钮的事件监听器
            document.querySelectorAll('.test-domain-notify').forEach(button => {
                button.addEventListener('click', () => testDomainNotification(button.dataset.id));
            });
            
            // 添加下拉按钮的事件监听器
            document.querySelectorAll('.toggle-details').forEach(button => {
                // 监听Bootstrap折叠/展开事件，更新域名显示样式
                const collapseTarget = document.querySelector(button.getAttribute('data-bs-target'));
                if (collapseTarget) {
                    // 监听展开事件
                    collapseTarget.addEventListener('shown.bs.collapse', function() {
                        // 找到包含此折叠内容的卡片
                        const domainCard = this.closest('.domain-card');
                        if (domainCard) {
                            // 添加expanded类，使域名可以换行显示
                            domainCard.classList.add('expanded');
                        }
                    });
                    
                    // 监听折叠事件
                    collapseTarget.addEventListener('hidden.bs.collapse', function() {
                        // 找到包含此折叠内容的卡片
                        const domainCard = this.closest('.domain-card');
                        if (domainCard) {
                            // 移除expanded类，使域名显示省略号
                            domainCard.classList.remove('expanded');
                        }
                    });
                }
                
                // 原有的点击事件处理
                button.addEventListener('click', function(e) {
                    // 如果当前是全部折叠模式，点击切换按钮会切换到自动折叠模式
                    // 但如果是全部展开模式，则保持该模式
                    if (viewMode === 'collapse-all') {
                        // 先阻止默认的bootstrap折叠/展开行为
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // 切换到自动折叠模式
                        viewMode = 'auto-collapse';
                        
                        // 更新视图按钮文本
                        document.getElementById('viewStyleDropdown').innerHTML = 
                            '<i class="iconfont icon-eye"></i> <span style="color: white;">列表样式</span>';
                        
                        // 获取当前按钮对应的卡片详情
                        const collapseTarget = document.querySelector(button.getAttribute('data-bs-target'));
                        
                        // 折叠所有其他卡片
                        document.querySelectorAll('.collapse.show').forEach(detail => {
                            if (detail !== collapseTarget) {
                                bootstrap.Collapse.getInstance(detail)?.hide();
                            }
                        });
                        
                        // 切换当前卡片的状态
                        const collapseInstance = bootstrap.Collapse.getInstance(collapseTarget);
                        if (collapseInstance) {
                            if (collapseTarget.classList.contains('show')) {
                                collapseInstance.hide();
                            } else {
                                collapseInstance.show();
                            }
                        }
                    } else if (viewMode === 'expand-all') {
                        // 在全部展开模式下，只处理折叠操作，不改变viewMode
                        const collapseTarget = document.querySelector(button.getAttribute('data-bs-target'));
                        const collapseInstance = bootstrap.Collapse.getInstance(collapseTarget);
                        
                        // 只有当用户尝试折叠卡片时才处理
                        if (collapseTarget.classList.contains('show')) {
                            // 先阻止默认的bootstrap折叠行为
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // 手动折叠当前卡片
                            collapseInstance?.hide();
                        }
                        // 如果是尝试展开一个已折叠的卡片，使用默认行为
                    }
                    // 在自动折叠模式下，使用默认的bootstrap行为
                });
            });
        }
        
        // 保存域名
        async function saveDomain() {
            const domainId = document.getElementById('domainId').value;
            const name = document.getElementById('domainName').value;
            const expiryDate = document.getElementById('expiryDate').value;
            const registrationDate = document.getElementById('registrationDate').value;
            const registrar = document.getElementById('registrar').value;
            const customNote = document.getElementById('customNote').value;
            const noteColor = document.getElementById('noteColor').value;
            const renewLink = document.getElementById('renewLink').value;
            
            // 获取续期周期设置
            const renewCycleValue = parseInt(document.getElementById('renewCycleValue').value) || 1;
            const renewCycleUnit = document.getElementById('renewCycleUnit').value;
            
            // 获取价格设置
            const priceValue = document.getElementById('priceValue').value ? parseFloat(document.getElementById('priceValue').value) : null;
            const priceCurrency = document.getElementById('priceCurrency').value;
            const priceUnit = document.getElementById('priceUnit').value;
            
            // 获取上次续期时间，如果用户清除了则设为null
            const lastRenewed = document.getElementById('lastRenewed').value || null;
            
            // 获取通知设置
            const useGlobalSettings = document.getElementById('useGlobalSettings').checked;
            const notifyEnabled = document.getElementById('notifyEnabled').checked;
            const notifyDays = parseInt(document.getElementById('domainNotifyDays').value) || 30;
            
            if (!name || !registrationDate || !expiryDate) {
                showAlert('danger', '域名、注册时间和到期日期为必填项');
                return;
            }
            
            // 确保通知设置字段存在且正确
            const notifySettings = {
                useGlobalSettings: useGlobalSettings,
                enabled: notifyEnabled,
                notifyDays: notifyDays
            };
            
            // 构建价格对象
            const priceObj = priceValue !== null ? {
                value: priceValue,
                currency: priceCurrency,
                unit: priceUnit
            } : null;

            
            const domainData = {
                name,
                expiryDate,
                registrationDate,
                registrar,
                customNote,
                noteColor,
                renewLink,
                lastRenewed,
                renewCycle: {
                    value: renewCycleValue,
                    unit: renewCycleUnit
                },
                price: priceObj,
                notifySettings: notifySettings
            };
                    
                    try {
                        let response;
                        if (domainId) {
                            // 更新现有域名
                            domainData.id = domainId;
                            response = await fetch('/api/domains/' + domainId, {
                                headers: { 'Content-Type': 'application/json' },
                                method: 'PUT',
                                body: JSON.stringify(domainData)
                            });
                        } else {
                            // 添加新域名
                            response = await fetch('/api/domains', {
                                headers: { 'Content-Type': 'application/json' },
                                method: 'POST',
                                body: JSON.stringify(domainData)
                            });
                        }
                        
                        if (!response.ok) throw new Error('保存域名失败');
                        
                        // 关闭模态框并重新加载域名列表
                        bootstrap.Modal.getInstance(document.getElementById('addDomainModal')).hide();
                        resetForm();
                        await loadDomains();
                        showAlert('success', domainId ? '域名更新成功' : '域名添加成功');
                    } catch (error) {
                        showAlert('danger', '保存域名失败: ' + error.message);
                    }
                }
                
                // 编辑域名
                function editDomain(id) {
                    const domain = domains.find(d => d.id === id);
                    if (!domain) return;
                    
                    document.getElementById('domainId').value = domain.id;
                    document.getElementById('domainName').value = domain.name;
                    document.getElementById('expiryDate').value = domain.expiryDate;
                    document.getElementById('registrationDate').value = domain.registrationDate !== undefined ? domain.registrationDate : '';
                    document.getElementById('registrar').value = domain.registrar !== undefined ? domain.registrar : '';
                    document.getElementById('customNote').value = domain.customNote !== undefined ? domain.customNote : '';
                    // 设置标签颜色（如果有）
                    if (domain.noteColor) {
                        document.getElementById('noteColor').value = domain.noteColor;
                    } else {
                        document.getElementById('noteColor').value = 'tag-blue'; // 默认蓝色
                    }
                    document.getElementById('renewLink').value = domain.renewLink !== undefined ? domain.renewLink : '';
                    
                    // 设置续期周期
                    if (domain.renewCycle) {
                        document.getElementById('renewCycleValue').value = domain.renewCycle.value || 1;
                        document.getElementById('renewCycleUnit').value = domain.renewCycle.unit || 'year';
                    } else {
                        document.getElementById('renewCycleValue').value = 1;
                        document.getElementById('renewCycleUnit').value = 'year';
                    }
                    
                    // 设置价格
                    if (domain.price) {
                        document.getElementById('priceValue').value = domain.price.value;
                        document.getElementById('priceCurrency').value = domain.price.currency || '¥';
                        document.getElementById('priceUnit').value = domain.price.unit || 'year';
                    } else {
                        document.getElementById('priceValue').value = '';
                        document.getElementById('priceCurrency').value = '¥';
                        document.getElementById('priceUnit').value = 'year';
                    }
                    
                    // 显示上次续期时间（如果有）
                    const lastRenewedContainer = document.getElementById('lastRenewedContainer');
                    const lastRenewedDisplay = document.getElementById('lastRenewedDisplay');
                    const lastRenewed = document.getElementById('lastRenewed');
                    
                    if (domain.lastRenewed) {
                        lastRenewedContainer.style.display = 'block';
                        lastRenewedDisplay.textContent = formatDate(domain.lastRenewed);
                        lastRenewed.value = domain.lastRenewed;
                    } else {
                        lastRenewedContainer.style.display = 'none';
                        lastRenewedDisplay.textContent = '';
                        lastRenewed.value = '';
                    }
                    
                    // 设置通知选项
                    const notifySettings = domain.notifySettings || { useGlobalSettings: true, enabled: true, notifyDays: 30 };
                    document.getElementById('useGlobalSettings').checked = notifySettings.useGlobalSettings;
                    document.getElementById('notifyEnabled').checked = notifySettings.enabled;
                    document.getElementById('domainNotifyDays').value = notifySettings.notifyDays || 30;
                    document.getElementById('domainNotifySettings').style.display = notifySettings.useGlobalSettings ? 'none' : 'block';
                    
                    document.querySelector('#addDomainModal .modal-title').textContent = '编辑域名';
                    const modal = new bootstrap.Modal(document.getElementById('addDomainModal'));
                    modal.show();
                    
                    // 在编辑模式下的设置
                    setTimeout(() => {
                        // 等待模态框完全显示后执行
                        document.getElementById('expiryDate').removeAttribute('readonly');
                        document.querySelector('label[for="expiryDate"]').innerHTML = '<i class="iconfont icon-calendar-days"></i> 到期日期(必填)';
                        document.querySelector('label[for="expiryDate"]').nextElementSibling.nextElementSibling.textContent = '根据注册时间和续期周期自动计算，可手动调整';
                        document.querySelector('label[for="expiryDate"]').nextElementSibling.nextElementSibling.className = 'form-text text-info';
                        updateNotePreview(); // 更新备注预览
                    }, 100);
                }
                
                // 显示删除确认模态框
                function showDeleteModal(id, name) {
                    currentDomainId = id;
                    document.getElementById('deleteModalDomainName').textContent = name;
                    const modal = new bootstrap.Modal(document.getElementById('deleteDomainModal'));
                    modal.show();
                }
                
                // 删除域名
                async function deleteDomain() {
                    if (!currentDomainId) return;
                    
                    try {
                        const response = await fetch('/api/domains/' + currentDomainId, {
                            method: 'DELETE'
                        });
                        
                        if (!response.ok) throw new Error('删除域名失败');
                        
                        // 关闭模态框并重新加载域名列表
                        bootstrap.Modal.getInstance(document.getElementById('deleteDomainModal')).hide();
                        currentDomainId = null;
                        await loadDomains();
                        showAlert('success', '域名删除成功');
                    } catch (error) {
                        showAlert('danger', '删除域名失败: ' + error.message);
                    }
                }
                
                // 显示续期模态框
                function showRenewModal(id, name, expiryDate) {
                    currentDomainId = id;
                    document.getElementById('renewModalDomainName').textContent = name;
                    
                    // 获取域名的续期周期设置
                    const domain = domains.find(d => d.id === id);
                    if (domain && domain.renewCycle) {
                        document.getElementById('renewPeriodValue').value = domain.renewCycle.value;
                        document.getElementById('renewPeriodUnit').value = domain.renewCycle.unit;
                    } else {
                        document.getElementById('renewPeriodValue').value = 1;
                        document.getElementById('renewPeriodUnit').value = 'year';
                    }
                    
                    // 计算新的到期日期
                    updateNewExpiryDate();
                    
                    const modal = new bootstrap.Modal(document.getElementById('renewDomainModal'));
                    modal.show();
                }
                
                // 更新新到期日期
                function updateNewExpiryDate() {
                    const domain = domains.find(d => d.id === currentDomainId);
                    if (!domain) return;
                    
                    const renewValue = parseInt(document.getElementById('renewPeriodValue').value) || 1;
                    const renewUnit = document.getElementById('renewPeriodUnit').value;
                    
                    // 无论域名是否过期，都从原先的到期日期开始计算
                    const expiryDate = new Date(domain.expiryDate);
                    const newExpiryDate = new Date(expiryDate);
                    
                    // 根据选择的单位添加时间
                    switch(renewUnit) {
                        case 'year':
                            newExpiryDate.setFullYear(expiryDate.getFullYear() + renewValue);
                            break;
                        case 'month':
                            newExpiryDate.setMonth(expiryDate.getMonth() + renewValue);
                            break;
                        case 'day':
                            newExpiryDate.setDate(expiryDate.getDate() + renewValue);
                            break;
                    }
                    
                    document.getElementById('newExpiryDate').value = newExpiryDate.toISOString().split('T')[0];
                }
                
                // 续期域名
                async function renewDomain() {
                    if (!currentDomainId) return;
                    
                    const renewValue = parseInt(document.getElementById('renewPeriodValue').value) || 1;
                    const renewUnit = document.getElementById('renewPeriodUnit').value;
                    const newExpiryDate = document.getElementById('newExpiryDate').value;
                    
                    try {
                        const response = await fetch('/api/domains/' + currentDomainId + '/renew', {
                            headers: { 'Content-Type': 'application/json' },
                            method: 'POST',
                            body: JSON.stringify({ 
                                value: renewValue, 
                                unit: renewUnit, 
                                newExpiryDate 
                            })
                        });
                        
                        if (!response.ok) throw new Error('域名续期失败');
                        
                        // 关闭模态框并重新加载域名列表
                        bootstrap.Modal.getInstance(document.getElementById('renewDomainModal')).hide();
                        currentDomainId = null;
                        await loadDomains();
                        showAlert('success', '域名续期成功');
                    } catch (error) {
                        showAlert('danger', '域名续期失败: ' + error.message);
                    }
                }
                
                // 重置表单
                function resetForm() {
                    document.getElementById('domainId').value = '';
                    document.getElementById('domainName').value = '';
                    document.getElementById('expiryDate').value = '';
                    document.getElementById('registrationDate').value = '';
                    document.getElementById('registrar').value = '';
                    document.getElementById('customNote').value = '';
                    document.getElementById('noteColor').value = 'tag-blue'; // 重置为默认蓝色
                    document.getElementById('renewLink').value = '';
                    
                    // 重置续期周期设置
                    document.getElementById('renewCycleValue').value = '1';
                    document.getElementById('renewCycleUnit').value = 'year';
                    
                    // 重置价格设置
                    document.getElementById('priceValue').value = '';
                    document.getElementById('priceCurrency').value = '¥';
                    document.getElementById('priceUnit').value = 'year';
                    
                    // 重置上次续期时间
                    document.getElementById('lastRenewed').value = '';
                    document.getElementById('lastRenewedContainer').style.display = 'none';
                    document.getElementById('lastRenewedDisplay').textContent = '';
                    document.getElementById('lastRenewedDisplay').classList.remove('text-danger');
                    
                    // 重置通知设置
                    document.getElementById('useGlobalSettings').checked = true;
                    document.getElementById('notifyEnabled').checked = true;
                    document.getElementById('domainNotifyDays').value = '30';
                    document.getElementById('domainNotifySettings').style.display = 'none';
                    
                    // 重置到期日期字段状态（添加新域名时保持可编辑）
                    document.getElementById('expiryDate').removeAttribute('readonly');
                    document.querySelector('label[for="expiryDate"]').innerHTML = '<i class="iconfont icon-calendar-days"></i> 到期日期(必填)';
                    document.querySelector('label[for="expiryDate"]').nextElementSibling.nextElementSibling.textContent = '根据注册时间和续期周期自动计算，可手动调整';
                    document.querySelector('label[for="expiryDate"]').nextElementSibling.nextElementSibling.className = 'form-text text-info';
                    
                    document.querySelector('#addDomainModal .modal-title').textContent = '添加新域名';
                }
                
                // 显示提示信息
                function showAlert(type, message) {
                    const alertDiv = document.createElement('div');
                    alertDiv.className = 'alert alert-' + type + ' alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
                    alertDiv.style.zIndex = '9999';
                    alertDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    alertDiv.style.borderRadius = '8px';
                    alertDiv.style.minWidth = '300px';
                    alertDiv.style.maxWidth = '80%';
                    
                    // 根据消息类型选择合适的图标
                    let iconClass = '';
                    switch(type) {
                        case 'success':
                            iconClass = 'icon-success';
                            break;
                        case 'danger':
                            iconClass = 'icon-error';
                            break;
                        case 'warning':
                            iconClass = 'icon-warning';
                            break;
                        case 'info':
                            iconClass = 'icon-info';
                            break;
                    }
                    
                    alertDiv.innerHTML = '<i class="iconfont ' + iconClass + '"></i> ' + message +
                        '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
                    document.body.appendChild(alertDiv);
                    
                    // 3秒后自动消失
                    setTimeout(() => {
                        alertDiv.classList.remove('show');
                        setTimeout(() => alertDiv.remove(), 300);
                    }, 3000);
                }
                
                // 格式化日期
                function formatDate(dateString) {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
                }

                // 添加测试单个域名通知的函数
                async function testDomainNotification(domainId) {
                    try {
                        const response = await fetch('/api/domains/' + domainId + '/test-notify', {
                            method: 'POST'
                        });
                        
                        if (!response.ok) {
                            const error = await response.json();
                            throw new Error(error.error || '测试失败');
                        }
                        
                        const result = await response.json();
                        showAlert('success', '通知测试成功！请检查Telegram是否收到消息');
                    } catch (error) {
                        showAlert('danger', '测试通知失败: ' + error.message);
                    }
                }

                // 按照指定字段和顺序排序域名
                function sortDomains(domains, field, order) {
                    domains.sort((a, b) => {
                        let valueA, valueB;
                        
                        // 根据字段提取排序值
                        switch (field) {
                            case 'name':
                                valueA = a.name.toLowerCase();
                                valueB = b.name.toLowerCase();
                                break;
                            case 'suffix':
                                // 获取域名后缀并反转字符串用于排序（从后往前排序）
                                const getSuffixForSort = (domain) => {
                                    return domain.toLowerCase().split('').reverse().join('');
                                };
                                valueA = getSuffixForSort(a.name);
                                valueB = getSuffixForSort(b.name);
                                break;
                            case 'customNote':
                                valueA = (a.customNote || '').toLowerCase();
                                valueB = (b.customNote || '').toLowerCase();
                                break;
                            case 'expiryDate':
                                valueA = new Date(a.expiryDate).getTime();
                                valueB = new Date(b.expiryDate).getTime();
                                break;
                            case 'daysLeft':
                                valueA = a.daysLeft;
                                valueB = b.daysLeft;
                                break;
                            case 'notifyDays':
                                const notifySettingsA = a.notifySettings || { useGlobalSettings: true, notifyDays: 30 };
                                const notifySettingsB = b.notifySettings || { useGlobalSettings: true, notifyDays: 30 };
                                valueA = notifySettingsA.useGlobalSettings ? (telegramConfig.notifyDays || 30) : notifySettingsA.notifyDays;
                                valueB = notifySettingsB.useGlobalSettings ? (telegramConfig.notifyDays || 30) : notifySettingsB.notifyDays;
                                break;
                            default:
                                valueA = a.daysLeft;
                                valueB = b.daysLeft;
                        }
                        
                        // 根据排序顺序返回比较结果
                        if (order === 'asc') {
                            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
                        } else {
                            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
                        }
                    });
                }
            </script>
        </body>
    </html>
`;

// 处理请求
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 检查是否已配置KV空间
  if (!isKVConfigured()) {
    // 如果请求是"完成设置"按钮的操作
    if (path === '/setup-complete') {
      return Response.redirect(url.origin, 302);
    }
    
    // 显示设置向导页面
    return new Response(getSetupHTML(), {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      },
    });
  }
  
  // 获取标题
  // 优先级：环境变量 > 代码变量 > 默认值'域名到期监控'
  let siteTitle = '域名到期监控';
  if (typeof SITE_NAME !== 'undefined' && SITE_NAME) {
    siteTitle = SITE_NAME;
  } else if (DEFAULT_SITE_NAME) {
    siteTitle = DEFAULT_SITE_NAME;
  }

  // 获取正确的密码
  // 优先级：环境变量 > 代码变量 > 默认密码'domain'
  let correctPassword = 'domain';
  if (typeof TOKEN !== 'undefined' && TOKEN) {
    correctPassword = TOKEN;
  } else if (DEFAULT_TOKEN) {
    correctPassword = DEFAULT_TOKEN;
  }

  // 检查是否已经登录（通过cookie）
  const cookieHeader = request.headers.get('Cookie') || '';
  const isAuthenticated = cookieHeader.includes('auth=true');
  
  // 处理登录POST请求
  if (path === '/login' && request.method === 'POST') {
    try {
      const requestData = await request.json();
      const submittedPassword = requestData.password;
      
      if (submittedPassword === correctPassword) {
        // 密码正确，设置cookie并重定向到dashboard
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': 'auth=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400', // 24小时过期
          },
        });
      } else {
        // 密码错误
        return new Response(JSON.stringify({ success: false, error: '密码错误' }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: '请求格式错误' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }
  
  // 处理dashboard页面请求
  if (path === '/dashboard') {
    if (isAuthenticated) {
      // 已登录，显示主页面
      const htmlContent = getHTMLContent(siteTitle);
      const response = new Response(htmlContent, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
        },
      });
      
      return await addFooterToResponse(response);
    } else {
      // 未登录，重定向到登录页面
      return Response.redirect(url.origin, 302);
    }
  }
  
  // 登出功能
  if (path === '/logout') {
    return new Response('登出成功', {
      status: 302,
      headers: {
        'Location': '/',
        'Set-Cookie': 'auth=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0', // 清除cookie
      },
    });
  }
  
  // 根路径或任何其他路径（除了/api和/dashboard）都显示登录页面
  if (path === '/' || (!path.startsWith('/api/') && path !== '/dashboard')) {
    // 如果已登录，重定向到dashboard
    if (isAuthenticated) {
      return Response.redirect(`${url.origin}/dashboard`, 302);
    }
    
    const loginHtml = getLoginHTML(siteTitle);
    return new Response(loginHtml, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      },
    });
  }
  
  // API 路由处理
  if (path.startsWith('/api/')) {
    // 检查是否已登录
    if (!isAuthenticated) {
      return jsonResponse({ error: '未授权访问', success: false }, 401);
    }
    
    return await handleApiRequest(request);
  }
  
  // 如果都不匹配，返回登录页面
  const loginHtml = getLoginHTML(siteTitle);
  return new Response(loginHtml, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
    },
  });
}



// 处理API请求
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 获取所有域名
  if (path === '/api/domains' && request.method === 'GET') {
    try {
      const domains = await getDomains();
      return jsonResponse(domains);
    } catch (error) {
      return jsonResponse({ error: '获取域名列表失败' }, 500);
    }
  }
  
  // 添加新域名
  if (path === '/api/domains' && request.method === 'POST') {
    try {
      const domainData = await request.json();
      const domain = await addDomain(domainData);
      return jsonResponse(domain, 201);
    } catch (error) {
      return jsonResponse({ error: '添加域名失败' }, 400);
    }
  }
  
  // 更新域名
  if (path.match(/^\/api\/domains\/[^\/]+$/) && request.method === 'PUT') {
    const id = path.split('/').pop();
    try {
      const domainData = await request.json();
      const domain = await updateDomain(id, domainData);
      return jsonResponse(domain);
    } catch (error) {
      return jsonResponse({ error: '更新域名失败' }, 400);
    }
  }
  
  // 删除域名
  if (path.match(/^\/api\/domains\/[^\/]+$/) && request.method === 'DELETE') {
    const id = path.split('/').pop();
    try {
      await deleteDomain(id);
      return jsonResponse({ success: true });
    } catch (error) {
      return jsonResponse({ error: '删除域名失败' }, 400);
    }
  }
  
  // 域名续期
  if (path.match(/^\/api\/domains\/[^\/]+\/renew$/) && request.method === 'POST') {
    const id = path.split('/')[3];
    try {
      const renewData = await request.json();
      const domain = await renewDomain(id, renewData);
      return jsonResponse(domain);
    } catch (error) {
      return jsonResponse({ error: '域名续期失败' }, 400);
    }
  }
  
  // 获取Telegram配置
  if (path === '/api/telegram/config' && request.method === 'GET') {
    try {
      const config = await getTelegramConfig();
      return jsonResponse(config);
    } catch (error) {
      return jsonResponse({ error: '获取Telegram配置失败' }, 500);
    }
  }
  
  // 保存Telegram配置
  if (path === '/api/telegram/config' && request.method === 'POST') {
    try {
      const configData = await request.json();
      const config = await saveTelegramConfig(configData);
      return jsonResponse(config);
    } catch (error) {
      console.error('保存Telegram配置失败:', error);
      return jsonResponse({ error: '保存Telegram配置失败: ' + error.message }, 400);
    }
  }
  
  // 测试Telegram通知
  if (path === '/api/telegram/test' && request.method === 'POST') {
    try {
      const result = await testTelegramNotification();
      return jsonResponse(result);
    } catch (error) {
      return jsonResponse({ error: '测试Telegram通知失败: ' + error.message }, 400);
    }
  }

  // 测试单个域名的通知
  if (path.match(/^\/api\/domains\/[^\/]+\/test-notify$/) && request.method === 'POST') {
    const id = path.split('/')[3];
    try {
      const result = await testSingleDomainNotification(id);
      return jsonResponse(result);
    } catch (error) {
      return jsonResponse({ error: '测试通知失败: ' + error.message }, 400);
    }
  }
  
  // 404 - 路由不存在
  return jsonResponse({ error: '未找到请求的资源' }, 404);
}

// 获取所有域名
async function getDomains() {
  const domainsStr = await DOMAIN_MONITOR.get('domains') || '[]';
  return JSON.parse(domainsStr);
}

// 添加新域名
async function addDomain(domainData) {
  const domains = await getDomains();
  
  // 验证域名数据
  if (!domainData.name || !domainData.registrationDate || !domainData.expiryDate) {
    throw new Error('域名、注册时间和到期日期为必填项');
  }
  
  // 生成唯一ID
  domainData.id = crypto.randomUUID();
  
  // 添加创建时间
  domainData.createdAt = new Date().toISOString();
  
  // 处理通知设置
  if (!domainData.notifySettings) {
    // 添加默认通知设置
    domainData.notifySettings = {
      useGlobalSettings: true,
      notifyDays: 30,
      enabled: true
    };
  }
  
          // 确保有lastRenewed字段
        if (!domainData.lastRenewed) {
            domainData.lastRenewed = null;
        }
        
        // 添加到列表
        domains.push(domainData);
        
        // 保存到KV
        await DOMAIN_MONITOR.put('domains', JSON.stringify(domains));
        
        return domainData;
}

// 更新域名
async function updateDomain(id, domainData) {
  const domains = await getDomains();
  
  // 查找域名索引
  const index = domains.findIndex(d => d.id === id);
  if (index === -1) {
    throw new Error('域名不存在');
  }
  
  // 验证域名数据
  if (!domainData.name || !domainData.registrationDate || !domainData.expiryDate) {
    throw new Error('域名、注册时间和到期日期为必填项');
  }
  
  // 确保通知设置正确
  let notifySettings;
  if (domainData.notifySettings) {
    // 使用提交的通知设置
    notifySettings = domainData.notifySettings;
  } else if (domains[index].notifySettings) {
    // 使用现有的通知设置
    notifySettings = domains[index].notifySettings;
  } else {
    // 创建默认通知设置
    notifySettings = {
      useGlobalSettings: true,
      notifyDays: 30,
      enabled: true
    };
  }
  
  // 更新域名 - 确保正确处理空值
  domains[index] = {
    ...domains[index],
    name: domainData.name,
    expiryDate: domainData.expiryDate,
    registrationDate: domainData.registrationDate !== undefined ? domainData.registrationDate : domains[index].registrationDate,
    registrar: domainData.registrar !== undefined ? domainData.registrar : domains[index].registrar,
    customNote: domainData.customNote !== undefined ? domainData.customNote : domains[index].customNote, // 正确处理空字符串
    noteColor: domainData.noteColor !== undefined ? domainData.noteColor : domains[index].noteColor, // 添加备注颜色处理
    renewLink: domainData.renewLink !== undefined ? domainData.renewLink : domains[index].renewLink, // 正确处理空字符串
    renewCycle: domainData.renewCycle || domains[index].renewCycle,
    price: domainData.price !== undefined ? domainData.price : domains[index].price, // 添加价格信息，保留现有价格如果未提供
    lastRenewed: domainData.lastRenewed !== undefined ? domainData.lastRenewed : domains[index].lastRenewed, // 根据用户选择更新续期时间
    notifySettings: notifySettings,
    updatedAt: new Date().toISOString()
  };
  
  // 保存到KV
  await DOMAIN_MONITOR.put('domains', JSON.stringify(domains));
  
  return domains[index];
}

// 删除域名
async function deleteDomain(id) {
  const domains = await getDomains();
  
  // 过滤掉要删除的域名
  const newDomains = domains.filter(d => d.id !== id);
  
  // 如果长度相同，说明没有找到要删除的域名
  if (newDomains.length === domains.length) {
    throw new Error('域名不存在');
  }
  
  // 保存到KV
  await DOMAIN_MONITOR.put('domains', JSON.stringify(newDomains));
  
  return true;
}

// 域名续期
async function renewDomain(id, renewData) {
  const domains = await getDomains();
  
  // 查找域名索引
  const index = domains.findIndex(d => d.id === id);
  if (index === -1) {
    throw new Error('域名不存在');
  }
  
  const now = new Date();
  
      // 更新域名信息中的续期数据
    if (!domains[index].renewCycle) {
        domains[index].renewCycle = {
            value: renewData.value || 1,
            unit: renewData.unit || 'year'
        };
    }
    
    // 如果域名是已过期状态，标记为从当前时间开始的全新计算
    if (new Date(domains[index].expiryDate) < new Date()) {
        domains[index].renewedFromExpired = true;
        domains[index].renewStartDate = now.toISOString(); // 记录续期开始时间（当前时间）
    }
  
  // 更新到期日期和续期记录
  domains[index] = {
    ...domains[index],
    expiryDate: renewData.newExpiryDate,
    updatedAt: now.toISOString(),
    lastRenewed: now.toISOString(), // 记录本次续期时间
    lastRenewPeriod: {
      value: renewData.value,
      unit: renewData.unit
    } // 记录本次续期周期，用于进度条计算
  };
  
  // 保存到KV
  await DOMAIN_MONITOR.put('domains', JSON.stringify(domains));
  
  return domains[index];
}

// 获取Telegram配置
async function getTelegramConfig() {
  const configStr = await DOMAIN_MONITOR.get('telegram_config') || '{}';
  const config = JSON.parse(configStr);
  
  // 检查是否使用环境变量
  // 当环境变量存在且配置中的值为undefined、null或空字符串时，视为使用环境变量
  const tokenFromEnv = typeof TG_TOKEN !== 'undefined' && (
    config.botToken === undefined || 
    config.botToken === null || 
    config.botToken === ''
  );
  
  const chatIdFromEnv = typeof TG_ID !== 'undefined' && (
    config.chatId === undefined || 
    config.chatId === null || 
    config.chatId === ''
  );
  
  // 检查是否使用代码中定义的变量
  const tokenFromCode = !tokenFromEnv && DEFAULT_TG_TOKEN !== '' && (
    config.botToken === undefined || 
    config.botToken === null || 
    config.botToken === ''
  );
  
  const chatIdFromCode = !chatIdFromEnv && DEFAULT_TG_ID !== '' && (
    config.chatId === undefined || 
    config.chatId === null || 
    config.chatId === ''
  );
  
  // 返回完整的配置信息，包括token和chatId
  return {
    enabled: !!config.enabled,
    chatId: chatIdFromEnv || chatIdFromCode ? '' : (config.chatId || ''),
    botToken: tokenFromEnv || tokenFromCode ? '' : (config.botToken || ''), // 如果有环境变量或代码变量，则返回空字符串
    chatIdFromEnv: chatIdFromEnv || chatIdFromCode, // 环境变量或代码中有设置都显示为已配置
    tokenFromEnv: tokenFromEnv || tokenFromCode, // 环境变量或代码中有设置都显示为已配置
    hasToken: tokenFromEnv || tokenFromCode || (config.botToken !== undefined && config.botToken !== null && config.botToken !== ''),
    notifyDays: config.notifyDays || 30,
  };
}

// 保存Telegram配置
async function saveTelegramConfig(configData) {
  // 验证必要的配置 - 只有当启用Telegram通知且环境变量中也没有配置时才需要验证
  if (configData.enabled) {
    // 检查是否可以使用环境变量或用户输入的值
    // 注意：空字符串("")被视为有效的清除操作，不应该抛出错误
    const hasTokenSource = (configData.botToken !== undefined && configData.botToken !== null) || 
                          typeof TG_TOKEN !== 'undefined' || 
                          DEFAULT_TG_TOKEN !== '';
    const hasChatIdSource = (configData.chatId !== undefined && configData.chatId !== null) || 
                           typeof TG_ID !== 'undefined' || 
                           DEFAULT_TG_ID !== '';
    
    if (!hasTokenSource) {
      throw new Error('启用Telegram通知需要提供机器人Token或在环境变量中配置');
    }
    if (!hasChatIdSource) {
      throw new Error('启用Telegram通知需要提供聊天ID或在环境变量中配置');
    }
  }
  
  // 保存配置到KV - 即使值为空也保存，表示用户有意清除值
  const config = {
    enabled: !!configData.enabled,
    botToken: configData.botToken, // 可能为空字符串，表示用户清除了值
    chatId: configData.chatId, // 可能为空字符串，表示用户清除了值
    notifyDays: configData.notifyDays || 30,
  };
  
  await DOMAIN_MONITOR.put('telegram_config', JSON.stringify(config));
  
  // 检查是否使用环境变量
  // 当环境变量存在且配置中的值为undefined、null或空字符串时，视为使用环境变量
  const tokenFromEnv = typeof TG_TOKEN !== 'undefined' && (
    config.botToken === undefined || 
    config.botToken === null || 
    config.botToken === ''
  );
  
  const chatIdFromEnv = typeof TG_ID !== 'undefined' && (
    config.chatId === undefined || 
    config.chatId === null || 
    config.chatId === ''
  );
  
  // 检查是否使用代码中定义的变量
  const tokenFromCode = !tokenFromEnv && DEFAULT_TG_TOKEN !== '' && (
    config.botToken === undefined || 
    config.botToken === null || 
    config.botToken === ''
  );
  
  const chatIdFromCode = !chatIdFromEnv && DEFAULT_TG_ID !== '' && (
    config.chatId === undefined || 
    config.chatId === null || 
    config.chatId === ''
  );
  
  // 返回完整的配置信息，包括token和chatId
  return {
    enabled: config.enabled,
    chatId: chatIdFromEnv || chatIdFromCode ? '' : (config.chatId || ''),
    botToken: tokenFromEnv || tokenFromCode ? '' : (config.botToken || ''), // 如果有环境变量或代码变量，则返回空字符串
    chatIdFromEnv: chatIdFromEnv || chatIdFromCode, // 环境变量或代码中有设置都显示为已配置
    tokenFromEnv: tokenFromEnv || tokenFromCode, // 环境变量或代码中有设置都显示为已配置
    hasToken: tokenFromEnv || tokenFromCode || !!config.botToken,
    notifyDays: config.notifyDays,
  };
}

// 测试Telegram通知
async function testTelegramNotification() {
  const config = await getTelegramConfigWithToken();
  
  if (!config.enabled) {
    throw new Error('Telegram通知未启用');
  }
  
  if (!config.botToken && typeof TG_TOKEN === 'undefined' && DEFAULT_TG_TOKEN === '') {
    throw new Error('未配置Telegram机器人Token');
  }
  
  if (!config.chatId && typeof TG_ID === 'undefined' && DEFAULT_TG_ID === '') {
    throw new Error('未配置Telegram聊天ID');
  }
  
  const message = '这是一条来自域名监控系统的测试通知，如果您收到此消息，表示Telegram通知配置成功！';
  
  const result = await sendTelegramMessage(config, message);
  return { success: true, message: '测试通知已发送' };
}

// 获取完整的Telegram配置（包括token）
async function getTelegramConfigWithToken() {
  const configStr = await DOMAIN_MONITOR.get('telegram_config') || '{}';
  const config = JSON.parse(configStr);
  
  // 如果KV中没有token或chatId，或者是空字符串，但环境变量中有值，则使用环境变量中的值
  if (typeof TG_TOKEN !== 'undefined' && (
      config.botToken === undefined || 
      config.botToken === null || 
      config.botToken === ''
  )) {
    config.botToken = TG_TOKEN;
  }
  
  // 同样处理chatId
  if (typeof TG_ID !== 'undefined' && (
      config.chatId === undefined || 
      config.chatId === null || 
      config.chatId === ''
  )) {
    config.chatId = TG_ID;
  }
  
  // 如果环境变量中没有，但代码中有，则使用代码中的值
  else if (DEFAULT_TG_TOKEN !== '' && (
      config.botToken === undefined || 
      config.botToken === null || 
      config.botToken === ''
  )) {
    config.botToken = DEFAULT_TG_TOKEN;
  }
  
  // 如果环境变量中没有，但代码中有，则使用代码中的值
  else if (DEFAULT_TG_ID !== '' && (
      config.chatId === undefined || 
      config.chatId === null || 
      config.chatId === ''
  )) {
    config.chatId = DEFAULT_TG_ID;
  }
  
  return {
    enabled: !!config.enabled,
    botToken: config.botToken || '',
    chatId: config.chatId || '',
    notifyDays: config.notifyDays || 30,
  };
}

// 发送Telegram消息
async function sendTelegramMessage(config, message) {
  // 优先使用配置中的值，如果没有则使用环境变量或代码中的值
  let botToken = config.botToken;
  let chatId = config.chatId;
  
  // 如果配置中没有值，检查环境变量
  if (!botToken) {
    if (typeof TG_TOKEN !== 'undefined') {
      botToken = TG_TOKEN;
    } else if (DEFAULT_TG_TOKEN !== '') {
      botToken = DEFAULT_TG_TOKEN;
    }
  }
  
  if (!chatId) {
    if (typeof TG_ID !== 'undefined') {
      chatId = TG_ID;
    } else if (DEFAULT_TG_ID !== '') {
      chatId = DEFAULT_TG_ID;
    }
  }
  
  if (!botToken) {
    throw new Error('未配置Telegram机器人Token');
  }
  
  if (!chatId) {
    throw new Error('未配置Telegram聊天ID');
  }
  
  const url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error('发送Telegram消息失败: ' + (error.description || '未知错误'));
  }
  
  return await response.json();
}

// 返回JSON响应
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  });
}

// 设置定时任务，检查即将到期的域名并发送通知
async function checkExpiringDomains() {
  const domains = await getDomains();
  const today = new Date();
  
  // 获取Telegram配置
  const telegramConfig = await getTelegramConfigWithToken();
  const globalNotifyDays = telegramConfig.enabled ? telegramConfig.notifyDays : 30;
  
  // 筛选出即将到期和已过期的域名
  const domainsToNotify = domains.filter(domain => {
    const expiryDate = new Date(domain.expiryDate);
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    // 获取该域名的通知设置
    const notifySettings = domain.notifySettings || { useGlobalSettings: true, enabled: true, notifyDays: 30 };
    
    // 如果使用全局设置，则使用全局通知天数，否则使用域名自己的设置
    const notifyDays = notifySettings.useGlobalSettings ? globalNotifyDays : notifySettings.notifyDays;
    
    // 通知已过期的域名或即将到期的域名
    return notifySettings.enabled && (
      daysLeft <= 0 || // 已过期
      (daysLeft > 0 && daysLeft <= notifyDays) // 即将到期
    );
  });
  
  // 将域名分为已过期和即将到期两组
  const expiredDomains = domainsToNotify.filter(domain => {
    const expiryDate = new Date(domain.expiryDate);
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysLeft <= 0;
  });
  
  const expiringDomains = domainsToNotify.filter(domain => {
    const expiryDate = new Date(domain.expiryDate);
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysLeft > 0;
  });
  
  // 如果有即将到期或已过期的域名，发送通知
  if (expiringDomains.length > 0 || expiredDomains.length > 0) {
    
    // 如果启用了Telegram通知，则发送通知
    if (telegramConfig.enabled && 
        ((telegramConfig.botToken || typeof TG_TOKEN !== 'undefined') && 
         (telegramConfig.chatId || typeof TG_ID !== 'undefined'))) {
      try {
        // 发送即将到期的域名通知
        if (expiringDomains.length > 0) {
          await sendExpiringDomainsNotification(telegramConfig, expiringDomains, false);
        }
        
        // 发送已过期的域名通知
        if (expiredDomains.length > 0) {
          await sendExpiringDomainsNotification(telegramConfig, expiredDomains, true);
        }
      } catch (error) {
        console.error('发送Telegram通知失败: ' + error.message);
      }
    }
  }
}

// 发送域名通知（即将到期或已过期）
async function sendExpiringDomainsNotification(config, domains, isExpired) {
  if (domains.length === 0) return;
  
  // 构建消息内容
  let title = isExpired ? 
    '🚫 <b>域名已过期提醒</b> 🚫' : 
    '🚨 <b>域名到期提醒</b> 🚨';
  
  // 根据不同通知类型使用不同长度的等号分隔线
  // 域名到期提醒使用19个字符，域名已过期提醒使用21个字符
  const separator = isExpired ? 
    '=====================' : 
    '===================';
  // 域名之间的短横线分隔符统一使用40个字符
  const domainSeparator = '----------------------------------------';
  
  let message = title + '\n' + separator + '\n\n';
  
  domains.forEach((domain, index) => {
    const expiryDate = new Date(domain.expiryDate);
    const today = new Date();
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (index > 0) {
      message += '\n' + domainSeparator + '\n\n';
    }
    
    message += '🌍 <b>域名:</b> ' + domain.name + '\n';
    if (domain.registrar) {
      message += '🏬 <b>注册商:</b> ' + domain.registrar + '\n';
    }
    message += '⏳ <b>剩余时间:</b> ' + daysLeft + ' 天\n';
    message += '📅 <b>到期日期:</b> ' + formatDate(domain.expiryDate) + '\n';
    
    if (domain.renewLink) {
      message += '⚠️ <b>点击续期:</b> ' + domain.renewLink + '\n';
    } else {
      message += '⚠️ <b>点击续期:</b> 未设置续期链接\n';
    }
  });
  
  // 发送消息
  return await sendTelegramMessage(config, message);
}

// 添加测试单个域名通知的后端函数
async function testSingleDomainNotification(id) {
  // 获取域名信息
  const domains = await getDomains();
  const domain = domains.find(d => d.id === id);
  
  if (!domain) {
    throw new Error('域名不存在');
  }
  
  // 获取Telegram配置
  const telegramConfig = await getTelegramConfigWithToken();
  
  if (!telegramConfig.enabled) {
    throw new Error('Telegram通知未启用');
  }
  
  if (!telegramConfig.botToken && typeof TG_TOKEN === 'undefined') {
    throw new Error('未配置Telegram机器人Token');
  }
  
  if (!telegramConfig.chatId && typeof TG_ID === 'undefined') {
    throw new Error('未配置Telegram聊天ID');
  }
  
  // 构建测试消息
  const expiryDate = new Date(domain.expiryDate);
  const today = new Date();
  const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;
  
  let title = isExpired ? 
    '🚫 <b>域名已过期测试通知</b> 🚫' : 
    '🚨 <b>域名到期测试通知</b> 🚨';
  
  // 根据不同通知类型使用不同长度的分隔线
  // 域名到期测试通知使用23个字符，域名已过期测试通知使用25个字符
  const separator = isExpired ? 
    '=========================' : 
    '=======================';
  
  
  let message = title + '\n' + separator + '\n\n';
  message += '这是一条测试通知，用于预览域名' + (isExpired ? '已过期' : '到期') + '提醒的格式：\n\n';

  message += '🌍 <b>域名:</b> ' + domain.name + '\n';
  if (domain.registrar) {
    message += '🏬 <b>注册商:</b> ' + domain.registrar + '\n';
  }
  message += '⏳ <b>剩余时间:</b> ' + daysLeft + ' 天\n';
  message += '📅 <b>到期日期:</b> ' + formatDate(domain.expiryDate) + '\n';
  
  if (domain.renewLink) {
    message += '⚠️ <b>点击续期:</b> ' + domain.renewLink + '\n';
  } else {
    message += '⚠️ <b>点击续期:</b> 未设置续期链接\n';
  }
  
  // 发送测试消息
  const result = await sendTelegramMessage(telegramConfig, message);
  return { success: true, message: '测试通知已发送' };
}

// 格式化日期函数
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

// 注册Cloudflare Workers事件处理程序
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// 注册定时任务，每天检查一次
addEventListener('scheduled', event => {
  event.waitUntil(checkExpiringDomains());
});

// 添加页面底部版权信息
function addCopyrightFooter(html) {
  // 定义页脚内容和样式，只需要修改这里
  // 页脚文字大小
  const footerFontSize = '14px';
  // 页脚图标大小
  const footerIconSize = '14px';
  // 页脚图标颜色（使用CSS颜色值，如：#4e54c8、blue、rgba(0,0,0,0.7)等）
  const footerIconColor = 'white';
  
  const footerContent = `<span style="color: white;">Copyright © 2025 Faiz</span> | <i class="iconfont icon-github" style="font-size: ${footerIconSize}; color: ${footerIconColor};"></i><a href="https://github.com/kamanfaiz/CF-Domain-Autocheck" target="_blank" style="color: white; text-decoration: none;">GitHub Repository</a> | <i class="iconfont icon-book" style="font-size: ${footerIconSize}; color: ${footerIconColor};"></i><a href="https://blog.faiz.hidns.co/" target="_blank" style="color: white; text-decoration: none;">Faiz博客</a>`;
  
  const bodyEndIndex = html.lastIndexOf('</body>');
  
  // 如果找到了</body>标签
  if (bodyEndIndex !== -1) {
    // 在</body>标签前插入页脚和相关脚本
    const footer = `
      <style>
        html {
          height: 100%;
        }
        body {
          min-height: 100%;
          display: flex;
          flex-direction: column;
        }
        .content-wrapper {
          flex: 1 0 auto;
        }
        #copyright-footer {
          flex-shrink: 0;
          text-align: center;
          padding: 10px;
          font-size: ${footerFontSize};
          border-top: 1px solid rgba(255, 255, 255, 0.18);
          margin-top: auto;
          background-color: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
      </style>
      
      <footer id="copyright-footer">
        ${footerContent}
      </footer>
      
      <script>
        // 页面加载完成后执行
        document.addEventListener('DOMContentLoaded', function() {
          // 将body内的所有内容（除了页脚）包裹在一个div中
          const footer = document.getElementById('copyright-footer');
          const contentWrapper = document.createElement('div');
          contentWrapper.className = 'content-wrapper';
          
          // 将body中除页脚外的所有元素移到contentWrapper中
          while (document.body.firstChild !== footer) {
            if (document.body.firstChild) {
              contentWrapper.appendChild(document.body.firstChild);
            } else {
              break;
            }
          }
          
          // 将contentWrapper插入到body的开头
          document.body.insertBefore(contentWrapper, footer);
        });
      </script>
    `;
    
    return html.slice(0, bodyEndIndex) + footer + html.slice(bodyEndIndex);
  }
  
  // 如果没找到</body>标签，就直接添加到HTML末尾
  const footerHtml = `
    <div style="text-align: center; padding: 10px; font-size: ${footerFontSize}; margin-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.18); background-color: rgba(0, 0, 0, 0.2); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); color: white; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);">
      ${footerContent}
    </div>
  `;
  
  // 在</body>标签前插入页脚
  return html.replace('</body>', `${footerHtml}</body>`);
}

// 修改响应处理，添加版权信息
async function addFooterToResponse(response) {
  const contentType = response.headers.get('Content-Type') || '';
  
  // 只处理HTML响应
  if (contentType.includes('text/html')) {
    const html = await response.text();
    const modifiedHtml = addCopyrightFooter(html);
    
    return new Response(modifiedHtml, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }
  
  return response;
}

// 添加Pages兼容性支持
export default {
  async fetch(request, env, ctx) {
    // 在Pages环境中，env包含绑定的变量
    if (env) {
      // 将环境变量绑定到全局，以便与Workers代码兼容
      if (env.DOMAIN_MONITOR) {
        globalThis.DOMAIN_MONITOR = env.DOMAIN_MONITOR;
      }
      if (env.TOKEN) {
        globalThis.TOKEN = env.TOKEN;
      }
      if (env.LOGO_URL) {
        globalThis.LOGO_URL = env.LOGO_URL;
      }
      if (env.BACKGROUND_URL) {
        globalThis.BACKGROUND_URL = env.BACKGROUND_URL;
      }
      if (env.MOBILE_BACKGROUND_URL) {
        globalThis.MOBILE_BACKGROUND_URL = env.MOBILE_BACKGROUND_URL;
      }
      if (env.SITE_NAME) {
        globalThis.SITE_NAME = env.SITE_NAME;
      }
      if (env.TG_TOKEN) {
        globalThis.TG_TOKEN = env.TG_TOKEN;
      }
      if (env.TG_ID) {
        globalThis.TG_ID = env.TG_ID;
      }
    }
    
    // 使用相同的请求处理函数
    return handleRequest(request);
  },
  
  async scheduled(event, env, ctx) {
    // 在Pages环境中，env包含绑定的变量
    if (env) {
      // 将环境变量绑定到全局，以便与Workers代码兼容
      if (env.DOMAIN_MONITOR) {
        globalThis.DOMAIN_MONITOR = env.DOMAIN_MONITOR;
      }
      if (env.TG_TOKEN) {
        globalThis.TG_TOKEN = env.TG_TOKEN;
      }
      if (env.TG_ID) {
        globalThis.TG_ID = env.TG_ID;
      }
    }
    
    // 使用相同的定时任务处理函数
    return checkExpiringDomains();
  }
};

// 检查是否已配置KV
function isKVConfigured() {
  return typeof DOMAIN_MONITOR !== 'undefined';
}

// 获取配置向导HTML
function getSetupHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>域名监控系统 - 配置向导</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body {
      font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .setup-container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .step {
      margin-bottom: 20px;
      padding: 15px;
      border-left: 4px solid #4e54c8;
      background-color: #f8f9fa;
    }
    .step-number {
      display: inline-block;
      width: 30px;
      height: 30px;
      background-color: #4e54c8;
      color: white;
      text-align: center;
      line-height: 30px;
      border-radius: 50%;
      margin-right: 10px;
    }
    code {
      background-color: #f1f1f1;
      padding: 2px 5px;
      border-radius: 3px;
    }
    img {
      max-width: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin: 10px 0;
    }
    .alert {
      margin-top: 20px;
    }
    .btn-primary {
      background-color: #4e54c8;
      border-color: #4e54c8;
    }
    .btn-primary:hover {
      background-color: #3f44ae;
      border-color: #3f44ae;
    }
  </style>
</head>
<body>
  <div class="setup-container">
    <h1 class="mb-4">域名监控系统 - 配置向导</h1>
    
    <div class="alert alert-warning">
      <strong>提示：</strong> 检测到您尚未完成必要的配置。请按照以下步骤设置您的域名监控系统。
    </div>
    
    <div class="step">
      <h3><span class="step-number">1</span> 创建KV命名空间</h3>
      <p>首先，您需要创建一个KV命名空间来存储域名数据：</p>
      <ol>
        <li>登录到 <a href="https://dash.cloudflare.com/" target="_blank">Cloudflare仪表板</a></li>
        <li>选择您的账户，然后点击<strong>Workers & Pages</strong></li>
        <li>在左侧菜单中，点击<strong>KV</strong></li>
        <li>点击<strong>创建命名空间</strong>按钮</li>
        <li>输入命名空间名称，例如：<code>domain-monitor</code></li>
        <li>点击<strong>添加</strong>按钮完成创建</li>
      </ol>
    </div>
    
    <div class="step">
      <h3><span class="step-number">2</span> 绑定KV命名空间到您的项目</h3>
      <p>接下来，您需要将创建的KV命名空间绑定到您的Workers或Pages项目：</p>
      
      <h4>对于Workers项目：</h4>
      <ol>
        <li>在Workers & Pages页面，点击您的Workers项目</li>
        <li>点击<strong>设置</strong>标签，然后选择<strong>变量</strong></li>
        <li>在<strong>KV命名空间绑定</strong>部分，点击<strong>添加绑定</strong></li>
        <li>变量名设置为：<code>DOMAIN_MONITOR</code>（必须使用此名称）</li>
        <li>KV命名空间选择您刚才创建的命名空间</li>
        <li>点击<strong>保存</strong>按钮</li>
      </ol>
      
      <h4>对于Pages项目：</h4>
      <ol>
        <li>在Workers & Pages页面，点击您的Pages项目</li>
        <li>点击<strong>设置</strong>标签，然后选择<strong>函数</strong></li>
        <li>在<strong>KV命名空间绑定</strong>部分，点击<strong>添加绑定</strong></li>
        <li>变量名设置为：<code>DOMAIN_MONITOR</code>（必须使用此名称）</li>
        <li>KV命名空间选择您刚才创建的命名空间</li>
        <li>点击<strong>保存</strong>按钮</li>
      </ol>
    </div>
    
    <div class="step">
      <h3><span class="step-number">3</span> 设置环境变量（可选）</h3>
      <p>您可以设置以下环境变量来自定义您的域名监控系统：</p>
      <ul>
        <li><code>TOKEN</code> - 登录密码，如果不设置则默认使用"domain"</li>
        <li><code>SITE_NAME</code> - 网站标题</li>
        <li><code>LOGO_URL</code> - 自定义Logo图片URL</li>
        <li><code>BACKGROUND_URL</code> - 自定义桌面端背景图片URL</li>
        <li><code>MOBILE_BACKGROUND_URL</code> - 自定义移动端背景图片URL（可选，如果不设置则使用桌面端背景图片）</li>
        <li><code>TG_TOKEN</code> - Telegram机器人Token</li>
        <li><code>TG_ID</code> - Telegram聊天ID</li>
      </ul>
      <p>在Workers或Pages的<strong>设置 > 变量</strong>部分添加这些环境变量。</p>
    </div>
    
    <div class="text-center mt-4">
      <a href="/setup-complete" class="btn btn-primary btn-lg">我已完成设置，刷新页面</a>
    </div>
  </div>
</body>
</html>`;
}
