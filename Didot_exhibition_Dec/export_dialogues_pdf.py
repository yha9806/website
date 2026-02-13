#!/usr/bin/env python3
"""
东北展对话导出PDF脚本
将 northeast-dialogues.json 转换为美观的PDF文件
"""

import json
import os
from datetime import datetime
from fpdf import FPDF
from fpdf.enums import XPos, YPos


class DialoguePDF(FPDF):
    """自定义PDF类，支持中文"""

    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=25)
        self._load_fonts()

    def _load_fonts(self):
        """加载中文字体"""
        font_candidates = [
            # Linux - 文泉驿正黑 (WSL环境首选)
            ("/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc", "WQYZenHei"),
            # Linux - Droid Sans Fallback
            ("/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf", "DroidSans"),
            # Windows - 微软雅黑
            ("C:/Windows/Fonts/msyh.ttc", "MSYaHei"),
            # Windows - 宋体
            ("C:/Windows/Fonts/simsun.ttc", "SimSun"),
        ]

        for font_path, font_name in font_candidates:
            if os.path.exists(font_path):
                try:
                    self.add_font(font_name, "", font_path)
                    self.chinese_font = font_name
                    print(f"✓ 已加载字体: {font_name}")
                    return
                except Exception as e:
                    print(f"⚠ 加载字体失败 {font_path}: {e}")
                    continue

        self.chinese_font = "Helvetica"
        print("⚠ 未找到中文字体")

    def header(self):
        """页眉"""
        if self.page_no() > 1:
            self.set_font(self.chinese_font, "", 8)
            self.set_text_color(128, 128, 128)
            self.cell(0, 10, "东北亚记忆 / Northeast Asia Memory - AI艺术评论对话集",
                      new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
            self.ln(5)

    def footer(self):
        """页脚"""
        if self.page_no() > 1:
            self.set_y(-20)
            self.set_font(self.chinese_font, "", 8)
            self.set_text_color(128, 128, 128)
            self.cell(0, 10, f"— {self.page_no()} —",
                      new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")

    def cover_page(self, title: str, subtitle: str, date: str, count: int):
        """封面页"""
        self.add_page()

        # 顶部装饰线
        self.set_draw_color(100, 100, 100)
        self.set_line_width(0.5)
        self.line(30, 60, 180, 60)

        # 主标题
        self.set_y(80)
        self.set_font(self.chinese_font, "", 28)
        self.set_text_color(30, 30, 30)
        self.cell(0, 15, "东北亚记忆", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")

        self.set_font(self.chinese_font, "", 18)
        self.set_text_color(80, 80, 80)
        self.cell(0, 12, "Northeast Asia Memory", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")

        # 副标题
        self.ln(15)
        self.set_font(self.chinese_font, "", 14)
        self.set_text_color(60, 60, 60)
        self.cell(0, 10, subtitle, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")

        # 底部装饰线
        self.line(30, 150, 180, 150)

        # 信息
        self.set_y(180)
        self.set_font(self.chinese_font, "", 11)
        self.set_text_color(100, 100, 100)

        info_lines = [
            f"作品数量：{count} 件",
            f"对话轮次：{count * 6} 轮",
            f"生成日期：{date}",
            "模型：Claude Opus 4.5",
        ]
        for line in info_lines:
            self.cell(0, 8, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")

        # 底部
        self.set_y(250)
        self.set_font(self.chinese_font, "", 10)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, "VULCA Art Evaluation Platform", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.cell(0, 6, "vulcaart.art", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")

    def toc_page(self, dialogues: list):
        """目录页"""
        self.add_page()

        # 标题
        self.set_font(self.chinese_font, "", 16)
        self.set_text_color(30, 30, 30)
        self.cell(0, 12, "目 录 / Contents", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.ln(10)

        # 按章节分组
        chapters = {}
        for d in dialogues:
            chapter = d.get("chapter_cn", d.get("chapter", "其他"))
            if chapter not in chapters:
                chapters[chapter] = []
            chapters[chapter].append(d)

        for chapter, works in chapters.items():
            # 章节标题
            self.set_font(self.chinese_font, "", 11)
            self.set_text_color(50, 50, 50)
            self.cell(0, 10, f"| {chapter}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

            # 作品列表
            self.set_font(self.chinese_font, "", 10)
            self.set_text_color(80, 80, 80)
            for work in works:
                title = work.get("artwork_title", "未知作品")
                artist = work.get("artist", "未知艺术家")
                self.cell(10)  # 缩进
                self.cell(0, 7, f"- {title} - {artist}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

            self.ln(3)

    def dialogue_page(self, dialogue: dict, index: int):
        """单个作品对话页"""
        self.add_page()

        # 作品信息
        title = dialogue.get("artwork_title", "未知作品")
        artist = dialogue.get("artist", "未知艺术家")
        artist_cn = dialogue.get("artist_cn", "")
        chapter = dialogue.get("chapter_cn", dialogue.get("chapter", ""))
        participants = dialogue.get("participant_names", [])

        # 标题区域背景
        self.set_fill_color(245, 245, 245)
        self.rect(10, 25, 190, 35, "F")

        self.set_y(28)
        self.set_font(self.chinese_font, "", 14)
        self.set_text_color(30, 30, 30)
        self.cell(0, 8, f"作品 {index}: {title}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")

        self.set_font(self.chinese_font, "", 10)
        self.set_text_color(80, 80, 80)
        # 只显示拼音名，不显示中文名（根据策展方要求）
        artist_text = f"艺术家 / Artist: {artist}"
        self.cell(0, 6, artist_text, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")

        self.set_font(self.chinese_font, "", 9)
        self.set_text_color(100, 100, 100)
        self.cell(0, 6, f"章节: {chapter}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.cell(0, 6, f"评论家: {' / '.join(participants)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")

        self.ln(8)

        # 分隔线
        self.set_draw_color(200, 200, 200)
        self.line(20, self.get_y(), 190, self.get_y())
        self.ln(8)

        # 对话内容
        turns = dialogue.get("turns", [])
        for turn in turns:
            self._render_turn(turn)

    def _render_turn(self, turn: dict):
        """渲染单个对话轮次"""
        turn_num = turn.get("turn", 0)
        speaker = turn.get("speaker_name", "未知")
        content_zh = turn.get("content", "")
        content_en = turn.get("content_en", "")

        # 检查是否需要分页
        estimated_height = 40 + len(content_zh) // 30 * 5 + len(content_en) // 50 * 4
        if self.get_y() + estimated_height > 270:
            self.add_page()

        # 轮次标题
        self.set_font(self.chinese_font, "", 10)
        self.set_text_color(50, 50, 150)
        self.cell(0, 8, f"【第{turn_num}轮】{speaker}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # 中文内容
        self.set_font(self.chinese_font, "", 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 6, content_zh)

        self.ln(2)

        # 英文内容
        self.set_font(self.chinese_font, "", 9)
        self.set_text_color(100, 100, 100)
        self.multi_cell(0, 5, content_en)

        self.ln(6)


def main():
    """主函数"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(script_dir, "northeast-dialogues.json")
    output_file = os.path.join(script_dir, "northeast-dialogues.pdf")

    print("=" * 50)
    print("东北展对话 PDF 导出工具")
    print("=" * 50)

    # 1. 读取JSON
    print(f"\n📖 读取: {input_file}")
    with open(input_file, "r", encoding="utf-8") as f:
        dialogues = json.load(f)

    print(f"   找到 {len(dialogues)} 个对话")

    # 2. 创建PDF
    print("\n📝 创建 PDF...")
    pdf = DialoguePDF()

    # 封面
    today = datetime.now().strftime("%Y年%m月%d日")
    pdf.cover_page(
        title="东北亚记忆",
        subtitle="AI艺术评论对话集",
        date=today,
        count=len(dialogues),
    )

    # 目录
    pdf.toc_page(dialogues)

    # 按 artwork_id 排序
    sorted_dialogues = sorted(dialogues, key=lambda x: x.get("artwork_id", 0))

    for i, dialogue in enumerate(sorted_dialogues, 1):
        title = dialogue.get("artwork_title", "未知")
        print(f"   处理 [{i}/{len(dialogues)}]: {title}")
        pdf.dialogue_page(dialogue, i)

    # 3. 保存
    print(f"\n💾 保存: {output_file}")
    pdf.output(output_file)

    # 4. 验证
    if os.path.exists(output_file):
        size = os.path.getsize(output_file)
        print(f"\n✅ 成功! 文件大小: {size / 1024:.1f} KB")
    else:
        print("\n❌ 失败: 文件未生成")

    print("=" * 50)


if __name__ == "__main__":
    main()
