#!/usr/bin/env python3
"""Rough preview renderer for the .owm subset used in maps/candidates/.

Standard library only. For every .owm under the root it writes an .svg beside
the file, then writes one static gallery page with the SVGs inline.

    python3 tools/render_owm.py
    python3 tools/render_owm.py --root maps/candidates --gallery research/gallery.html

This is a preview, not a validator. onlinewardleymaps.com or the VS Code
extension is the real check. In particular, label positions here come from this
script's own placer, because the real renderers put every label at a fixed
offset unless the map says otherwise.
"""
from __future__ import annotations

import argparse
import html
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# Stage boundaries as OnlineWardleyMaps draws them by default (from memory of its
# grid: 3.5/20, 8/20, 14/20). The .owm files do not set their own.
STAGES = [
    (0.0, 0.175, "Genesis"),
    (0.175, 0.40, "Custom built"),
    (0.40, 0.70, "Product (+rental)"),
    (0.70, 1.0, "Commodity (+utility)"),
]
METHOD_FILL = {"build": "#a9cdec", "buy": "#f4cf85", "outsource": "#c4c4c4"}
EVOLVE_RED = "#c0392b"
NOTE_INK = "#5a3d8a"
INK = "#1f2933"
LINK_INK = "#9aa5b1"

W, H = 1360, 930
PLOT = (64, 50, 1340, 850)  # left, top, right, bottom
FONT = "'Noto Sans', 'Helvetica Neue', Arial, sans-serif"
LABEL_SIZE = 14
LINE_H = 17
DOT_R = 6
HALO_R = 13

NUM = r"-?\d*\.?\d+"
COORD = rf"\[\s*({NUM})\s*,\s*({NUM})\s*\]"
PLACED = re.compile(rf"^(component|anchor)\s+(.+?)\s*{COORD}(.*)$")
NOTE = re.compile(rf"^note\s+(.+?)\s*{COORD}\s*$")
EVOLVE = re.compile(rf"^evolve\s+(.+?)\s+({NUM})\s*(.*)$")
LABEL_MOD = re.compile(rf"label\s*{COORD}")


# ---------------------------------------------------------------- parsing


@dataclass
class Node:
    name: str
    vis: float
    mat: float
    kind: str = "component"
    method: str | None = None
    inertia: bool = False
    label_offset: tuple[float, float] | None = None


@dataclass
class Evolve:
    name: str
    target_name: str
    mat: float
    inertia: bool = False


@dataclass
class Map:
    path: Path
    title: str = ""
    style: str = ""
    comments: list[str] = field(default_factory=list)
    nodes: dict[str, Node] = field(default_factory=dict)
    links: list[tuple[str, str]] = field(default_factory=list)
    link_labels: dict[tuple[str, str], str] = field(default_factory=dict)
    evolves: list[Evolve] = field(default_factory=list)
    notes: list[tuple[str, float, float]] = field(default_factory=list)
    unparsed: list[tuple[int, str, str]] = field(default_factory=list)  # line, text, why
    problems: list[str] = field(default_factory=list)  # valid syntax, wrong reference or range
    layout: list[str] = field(default_factory=list)  # preview-only placement issues
    line_count: int = 0


def parse_modifiers(rest: str, node: Node) -> str:
    """Apply trailing component modifiers. Returns whatever was not understood."""
    match = LABEL_MOD.search(rest)
    if match:
        node.label_offset = (float(match[1]), float(match[2]))
        rest = rest[: match.start()] + rest[match.end() :]
    for token in rest.split():
        if token in ("inertia", "(inertia)"):
            node.inertia = True
        elif token in ("(build)", "(buy)", "(outsource)"):
            node.method = token.strip("()")
        else:
            return token
    return ""


def parse(path: Path) -> Map:
    m = Map(path=path)
    in_block = False
    for number, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw.strip()
        if not line:
            continue
        m.line_count += 1
        if in_block:
            in_block = "*/" not in line
            continue
        if line.startswith("/*"):
            in_block = "*/" not in line
            continue
        if line.startswith("//"):
            m.comments.append(line[2:].strip())
            continue
        keyword = line.split()[0]
        if keyword == "title":
            m.title = line[5:].strip()
        elif keyword == "style":
            m.style = line[5:].strip()
        elif keyword in ("component", "anchor"):
            match = PLACED.match(line)
            if not match:
                m.unparsed.append((number, line, f"{keyword} without [visibility, maturity]"))
                continue
            kind, name, vis, mat, rest = match.groups()
            node = Node(name, float(vis), float(mat), kind)
            leftover = parse_modifiers(rest, node)
            if leftover:
                m.unparsed.append((number, line, f"unknown modifier {leftover!r}"))
            if name in m.nodes:
                m.problems.append(f"line {number}: {name!r} is declared twice")
            m.nodes[name] = node
            if not (0 <= node.vis <= 1 and 0 <= node.mat <= 1):
                m.problems.append(f"line {number}: {name!r} is outside the 0 to 1 range")
        elif keyword == "note":
            match = NOTE.match(line)
            if match:
                m.notes.append((match[1], float(match[2]), float(match[3])))
            else:
                m.unparsed.append((number, line, "note without [visibility, maturity]"))
        elif keyword == "evolve":
            match = EVOLVE.match(line)
            if not match:
                m.unparsed.append((number, line, "evolve without a target maturity"))
                continue
            name, mat, rest = match.groups()
            source, _, target = name.partition("->")
            holder = Node(source.strip(), 0, 0)
            leftover = parse_modifiers(rest, holder)
            if leftover:
                m.unparsed.append((number, line, f"unknown modifier {leftover!r}"))
            m.evolves.append(
                Evolve(source.strip(), (target or source).strip(), float(mat), holder.inertia)
            )
        elif "->" in line and not re.search(r"\+[<>]", line):
            body, _, label = line.partition(";")
            left, _, right = body.partition("->")
            pair = (left.strip(), right.strip())
            if pair in m.links:
                m.problems.append(f"line {number}: repeated link {pair[0]} -> {pair[1]}")
            m.links.append(pair)
            if label.strip():
                m.link_labels[pair] = label.strip()
        else:
            m.unparsed.append((number, line, "not in the subset this script understands"))

    if not m.title:
        m.problems.append("no title line")
    evolved_names = {e.target_name for e in m.evolves}
    for e in m.evolves:
        node = m.nodes.get(e.name)
        if node is None:
            m.problems.append(f"evolve names {e.name!r}, which is not declared")
        elif e.mat <= node.mat:
            m.problems.append(
                f"evolve {e.name!r} to {e.mat} does not move right (it starts at {node.mat})"
            )
    for left, right in m.links:
        for end in (left, right):
            if end not in m.nodes and end not in evolved_names:
                m.problems.append(f"link {left} -> {right}: {end!r} is not declared")
    return m


# ---------------------------------------------------------------- geometry


def px(mat: float) -> float:
    return PLOT[0] + mat * (PLOT[2] - PLOT[0])


def py(vis: float) -> float:
    return PLOT[1] + (1 - vis) * (PLOT[3] - PLOT[1])


def text_width(text: str, size: float = LABEL_SIZE) -> float:
    """Slightly generous estimate for a humanist sans such as Noto Sans."""
    total = 0.0
    for ch in text:
        if ch in "iljtfrI.,:;'!| ":
            total += 0.33
        elif ch in "mwMW":
            total += 0.88
        elif ch.isupper():
            total += 0.68
        else:
            total += 0.57
    return total * size


def wrap(text: str, width: int) -> list[str]:
    lines: list[str] = []
    current = ""
    for word in text.split():
        if current and len(current) + 1 + len(word) > width:
            lines.append(current)
            current = word
        else:
            current = f"{current} {word}".strip()
    return lines + [current]


def boxes_overlap(a, b, pad: float = 0.0) -> bool:
    return a[0] < b[2] + pad and b[0] < a[2] + pad and a[1] < b[3] + pad and b[1] < a[3] + pad


def segment_hits_box(seg, box) -> bool:
    """Liang-Barsky clip test."""
    x0, y0, x1, y1 = seg
    dx, dy = x1 - x0, y1 - y0
    low, high = 0.0, 1.0
    for p, q in (
        (-dx, x0 - box[0]),
        (dx, box[2] - x0),
        (-dy, y0 - box[1]),
        (dy, box[3] - y0),
    ):
        if p == 0:
            if q < 0:
                return False
            continue
        t = q / p
        if p < 0:
            low = max(low, t)
        else:
            high = min(high, t)
        if low > high:
            return False
    return True


# ---------------------------------------------------------------- label placement


@dataclass
class Candidate:
    box: tuple[float, float, float, float]
    lines: list[str]
    anchor: str
    tx: float
    ty: float
    leader: bool
    static: float = 0.0


@dataclass
class Label:
    key: str
    text: str
    cx: float
    cy: float
    r: float
    color: str
    candidates: list[Candidate] = field(default_factory=list)
    chosen: Candidate | None = None


def two_line_split(text: str) -> list[str] | None:
    words = text.split()
    if len(words) < 2 or len(text) < 13:
        return None
    splits = [(" ".join(words[:i]), " ".join(words[i:])) for i in range(1, len(words))]
    best = min(splits, key=lambda pair: abs(len(pair[0]) - len(pair[1])))
    return list(best)


def build_candidates(label: Label) -> None:
    variants = [[label.text]]
    split = two_line_split(label.text)
    if split:
        variants.append(split)
    for variant_rank, lines in enumerate(variants):
        w = max(text_width(line) for line in lines)
        h = len(lines) * LINE_H
        for tier in range(3):
            r = label.r + 3 + tier * 24
            diag = r * 0.72
            places = [
                (label.cx + r, label.cy - h / 2, "start"),  # E
                (label.cx + diag, label.cy - diag - h, "start"),  # NE
                (label.cx + diag, label.cy + diag, "start"),  # SE
                (label.cx - w - r, label.cy - h / 2, "end"),  # W
                (label.cx - w - diag, label.cy - diag - h, "end"),  # NW
                (label.cx - w - diag, label.cy + diag, "end"),  # SW
                (label.cx - w / 2, label.cy - r - h, "middle"),  # N
                (label.cx - w / 2, label.cy + r, "middle"),  # S
            ]
            for rank, (x0, y0, anchor) in enumerate(places):
                box = (x0, y0, x0 + w, y0 + h)
                if box[0] < PLOT[0] + 2 or box[1] < PLOT[1] + 2:
                    continue
                if box[2] > PLOT[2] - 2 or box[3] > PLOT[3] - 2:
                    continue
                tx = {"start": x0, "end": x0 + w, "middle": x0 + w / 2}[anchor]
                candidate = Candidate(box, lines, anchor, tx, y0 + 13, tier > 0)
                candidate.static = rank * 2 + tier * 45 + variant_rank * 8
                label.candidates.append(candidate)


def place_labels(labels, dots, fixed_boxes, bars, segments, arrows) -> None:
    """Greedy start, then a few passes of re-choosing each label given the rest."""
    for label in labels:
        build_candidates(label)
        for c in label.candidates:
            for key, x, y, r in dots:
                if key != label.key and boxes_overlap(c.box, (x - r, y - r, x + r, y + r), 1):
                    c.static += 900
            c.static += 900 * sum(boxes_overlap(c.box, b, 3) for b in fixed_boxes)
            c.static += 500 * sum(boxes_overlap(c.box, b, 2) for b in bars)
            c.static += 110 * sum(segment_hits_box(s, c.box) for s in arrows)
            c.static += 35 * sum(segment_hits_box(s, c.box) for s in segments)

    def dynamic(label: Label, c: Candidate) -> float:
        cost = 0.0
        for other in labels:
            if other is label or other.chosen is None:
                continue
            if boxes_overlap(c.box, other.chosen.box, 3):
                cost += 1500
            elif c.leader and other.chosen.leader:
                cost += 1
        return cost

    order = sorted(labels, key=lambda lb: min((c.static for c in lb.candidates), default=0))
    for _ in range(7):
        changed = False
        for label in reversed(order):
            if not label.candidates:
                continue
            best = min(label.candidates, key=lambda c: c.static + dynamic(label, c))
            if best is not label.chosen:
                label.chosen, changed = best, True
        if not changed:
            break


# ---------------------------------------------------------------- SVG


def esc(text: str) -> str:
    return html.escape(text, quote=True)


def svg_text(x, y, text, size=LABEL_SIZE, fill=INK, anchor="start", weight=None, style=None,
             halo=True, extra="") -> str:
    attrs = f'x="{x:.1f}" y="{y:.1f}" font-size="{size}" fill="{fill}" text-anchor="{anchor}"'
    if weight:
        attrs += f' font-weight="{weight}"'
    if style:
        attrs += f' font-style="{style}"'
    if halo:
        attrs += (' stroke="#fff" stroke-width="3.5" stroke-linejoin="round"'
                  ' paint-order="stroke"')
    return f"<text {attrs}{extra}>{esc(text)}</text>"


def legend() -> list[str]:
    y = H - 22
    out: list[str] = []
    x = PLOT[0]
    for name in ("build", "buy", "outsource"):
        out.append(f'<circle cx="{x + 8}" cy="{y - 5}" r="{HALO_R - 2}" fill="{METHOD_FILL[name]}"/>')
        out.append(f'<circle cx="{x + 8}" cy="{y - 5}" r="{DOT_R - 1}" fill="#fff" stroke="{INK}" stroke-width="1.6"/>')
        out.append(svg_text(x + 26, y, name, 13, halo=False))
        x += 44 + text_width(name, 13)
    out.append(f'<rect x="{x}" y="{y - 15}" width="5" height="20" fill="{INK}"/>')
    out.append(svg_text(x + 13, y, "inertia", 13, halo=False))
    x += 80
    out.append(f'<line x1="{x}" y1="{y - 5}" x2="{x + 34}" y2="{y - 5}" stroke="{EVOLVE_RED}" stroke-width="2" stroke-dasharray="6 4"/>')
    out.append(f'<polygon points="{x + 42},{y - 5} {x + 32},{y - 10} {x + 32},{y}" fill="{EVOLVE_RED}"/>')
    out.append(svg_text(x + 50, y, "evolve", 13, halo=False))
    x += 110
    out.append(svg_text(x, y, "note text", 13, NOTE_INK, style="italic", halo=False))
    out.append(svg_text(PLOT[2], y, "rough preview, not the real renderer", 13, "#7b8794", "end", halo=False))
    return out


def render(m: Map) -> str:
    left, top, right, bottom = PLOT
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" '
        f'aria-label="{esc(m.title)}" font-family="{esc(FONT)}">',
        f'<rect width="{W}" height="{H}" fill="#fff"/>',
    ]
    out.append(svg_text(left, 32, m.title, 19, weight="600", halo=False))

    # Stages and axes
    for i, (start, end, name) in enumerate(STAGES):
        x0, x1 = px(start), px(end)
        if i % 2 == 0:
            out.append(f'<rect x="{x0:.1f}" y="{top}" width="{x1 - x0:.1f}" height="{bottom - top}" fill="#f6f7f9"/>')
        if i:
            out.append(f'<line x1="{x0:.1f}" y1="{top}" x2="{x0:.1f}" y2="{bottom}" stroke="#cbd2d9" stroke-dasharray="4 5"/>')
        out.append(svg_text((x0 + x1) / 2, bottom + 22, name, 14, "#3e4c59", "middle", "600", halo=False))
    out.append(f'<line x1="{left}" y1="{bottom}" x2="{right}" y2="{bottom}" stroke="{INK}" stroke-width="1.5"/>')
    out.append(f'<line x1="{left}" y1="{bottom}" x2="{left}" y2="{top}" stroke="{INK}" stroke-width="1.5"/>')
    out.append(f'<polygon points="{right + 10},{bottom} {right},{bottom - 5} {right},{bottom + 5}" fill="{INK}"/>')
    out.append(f'<polygon points="{left},{top - 10} {left - 5},{top} {left + 5},{top}" fill="{INK}"/>')
    out.append(svg_text(right, bottom + 40, "Evolution", 13, "#52606d", "end", halo=False))
    for y, text, anchor in ((top, "Visible", "end"), ((top + bottom) / 2, "Value chain", "middle"), (bottom, "Invisible", "start")):
        out.append(svg_text(0, 0, text, 13, "#52606d", anchor, halo=False,
                            extra=f' transform="translate({left - 12},{y:.1f}) rotate(-90)"'))

    # Positions
    points: dict[str, tuple[float, float]] = {}
    for name, node in m.nodes.items():
        points[name] = (px(node.mat), py(node.vis))
    ghosts: list[tuple[Evolve, float, float]] = []
    for e in m.evolves:
        node = m.nodes.get(e.name)
        if node is None:
            continue
        gx, gy = px(e.mat), py(node.vis)
        ghosts.append((e, gx, gy))
        if e.target_name != e.name:
            points[e.target_name] = (gx, gy)

    anchors = [n for n in m.nodes.values() if n.kind == "anchor"]
    components = [n for n in m.nodes.values() if n.kind != "anchor"]

    # Fixed text: anchors and notes
    fixed_boxes = []
    anchor_svg, note_svg = [], []
    for n in anchors:
        x, y = points[n.name]
        w = text_width(n.name, 15)
        x = min(max(x, left + w / 2 + 3), right - w / 2 - 3)
        y = max(y, top + 14)
        points[n.name] = (x, y)
        fixed_boxes.append((x - w / 2, y - 13, x + w / 2, y + 7))
        anchor_svg.append(svg_text(x, y, n.name, 15, INK, "middle", "700"))
    for text, vis, mat in m.notes:
        lines = wrap(text, 38)
        w = max(text_width(line, 13) for line in lines)
        x, y = px(mat), py(vis) + 12
        if x + w > right - 3:
            m.layout.append(f"note {text!r} would run past the right edge; shifted left in this preview")
            x = right - 3 - w
        y = min(max(y, top + 14), bottom - 4 - (len(lines) - 1) * 16)
        fixed_boxes.append((x, y - 12, x + w, y + 4 + (len(lines) - 1) * 16))
        for i, line in enumerate(lines):
            note_svg.append(svg_text(x, y + i * 16, line, 13, NOTE_INK, style="italic"))

    # Links
    segments = []
    link_svg = []
    for a, b in m.links:
        if a not in points or b not in points:
            continue
        x0, y0 = points[a]
        x1, y1 = points[b]
        if m.nodes.get(a) and m.nodes[a].kind == "anchor":
            y0 += 8
        segments.append((x0, y0, x1, y1))
        link_svg.append(f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" stroke="{LINK_INK}" stroke-width="1.2"/>')

    # Evolve arrows
    arrows = []
    arrow_svg = []
    for e, gx, gy in ghosts:
        x0, y0 = points[e.name]
        direction = 1 if gx >= x0 else -1
        arrows.append((x0, y0, gx, gy))
        tip = gx - direction * (DOT_R + 2)
        arrow_svg.append(
            f'<line x1="{x0 + direction * (DOT_R + 2):.1f}" y1="{y0:.1f}" x2="{tip - direction * 8:.1f}" y2="{gy:.1f}" '
            f'stroke="{EVOLVE_RED}" stroke-width="1.8" stroke-dasharray="6 4"/>'
        )
        arrow_svg.append(
            f'<polygon points="{tip:.1f},{gy:.1f} {tip - direction * 10:.1f},{gy - 5:.1f} '
            f'{tip - direction * 10:.1f},{gy + 5:.1f}" fill="{EVOLVE_RED}"/>'
        )

    # Dots, method halos, inertia bars
    bars = []
    dot_svg = []
    dots = []
    for n in components:
        x, y = points[n.name]
        radius = HALO_R if n.method else DOT_R
        dots.append((n.name, x, y, radius))
        if n.method:
            dot_svg.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{HALO_R}" fill="{METHOD_FILL[n.method]}"/>')
    for n in components:
        x, y = points[n.name]
        if n.inertia:
            bx = x + HALO_R + 3
            bars.append((bx, y - 13, bx + 5, y + 13))
            dot_svg.append(f'<rect x="{bx:.1f}" y="{y - 13:.1f}" width="5" height="26" fill="{INK}"/>')
        dot_svg.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{DOT_R}" fill="#fff" stroke="{INK}" stroke-width="1.8"/>')
    for e, gx, gy in ghosts:
        dots.append((f"evolved:{e.name}", gx, gy, DOT_R))
        if e.inertia:
            bars.append((gx + 9, gy - 13, gx + 14, gy + 13))
            dot_svg.append(f'<rect x="{gx + 9:.1f}" y="{gy - 13:.1f}" width="5" height="26" fill="{INK}"/>')
        dot_svg.append(f'<circle cx="{gx:.1f}" cy="{gy:.1f}" r="{DOT_R}" fill="#fff" stroke="{EVOLVE_RED}" stroke-width="1.8"/>')

    # Labels
    labels = [
        Label(n.name, n.name, *points[n.name], HALO_R if n.method else DOT_R, INK)
        for n in components
    ]
    labels += [Label(f"evolved:{e.name}", e.target_name, gx, gy, DOT_R, EVOLVE_RED) for e, gx, gy in ghosts]
    place_labels(labels, dots, fixed_boxes, bars, segments, arrows)

    label_svg, leader_svg = [], []
    for label in labels:
        c = label.chosen
        if c is None:
            m.layout.append(f"no room for the label {label.text!r}; drawn beside its dot")
            label_svg.append(svg_text(label.cx + label.r + 3, label.cy + 5, label.text, fill=label.color))
            continue
        if c.leader:
            ex = min(max(label.cx, c.box[0]), c.box[2])
            ey = min(max(label.cy, c.box[1]), c.box[3])
            leader_svg.append(f'<line x1="{label.cx:.1f}" y1="{label.cy:.1f}" x2="{ex:.1f}" y2="{ey:.1f}" stroke="{label.color}" stroke-width="0.8" stroke-opacity="0.65"/>')
        for i, line in enumerate(c.lines):
            label_svg.append(svg_text(c.tx, c.ty + i * LINE_H, line, fill=label.color, anchor=c.anchor))

    # What the placer could not solve
    placed = [lb for lb in labels if lb.chosen]
    for i, a in enumerate(placed):
        for b in placed[i + 1 :]:
            if boxes_overlap(a.chosen.box, b.chosen.box):
                m.layout.append(f"labels overlap: {a.text!r} and {b.text!r}")
        for key, x, y, r in dots:
            if key != a.key and boxes_overlap(a.chosen.box, (x - r, y - r, x + r, y + r)):
                m.layout.append(f"label {a.text!r} sits on the dot for {key!r}")
        if any(boxes_overlap(a.chosen.box, box) for box in fixed_boxes):
            m.layout.append(f"label {a.text!r} sits on a note or anchor")
    for i, (key_a, xa, ya, _) in enumerate(dots):
        for key_b, xb, yb, _ in dots[i + 1 :]:
            if abs(xa - xb) < DOT_R * 2 and abs(ya - yb) < DOT_R * 2:
                m.layout.append(f"dots touch: {key_a!r} and {key_b!r}")

    out += link_svg + arrow_svg + note_svg + dot_svg + leader_svg + anchor_svg + label_svg + legend()
    out.append("</svg>")
    return "\n".join(out) + "\n"


# ---------------------------------------------------------------- gallery


def inline_md(text: str) -> str:
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = esc(text).replace("&#x27;", "'").replace("&quot;", '"')
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<![\w*])\*([^*\s][^*]*?)\*(?![\w*])", r"<em>\1</em>", text)
    return text


def block_md(lines: list[str]) -> str:
    out, para, items = [], [], []

    def flush():
        if para:
            out.append(f"<p>{inline_md(' '.join(para))}</p>")
            para.clear()
        if items:
            out.append("<ul>" + "".join(f"<li>{inline_md(i)}</li>" for i in items) + "</ul>")
            items.clear()

    for line in lines:
        stripped = line.strip()
        if not stripped:
            flush()
        elif stripped.startswith("- "):
            if para:
                flush()
            items.append(stripped[2:])
        elif items:
            items[-1] += " " + stripped
        else:
            para.append(stripped)
    flush()
    return "\n".join(out)


def read_thesis(readme: Path) -> tuple[str, str]:
    """Returns (heading, thesis html) from a candidate README."""
    if not readme.exists():
        return "", "<p>No README found for this candidate.</p>"
    lines = readme.read_text(encoding="utf-8").splitlines()
    heading = next((ln.lstrip("# ").strip() for ln in lines if ln.startswith("# ")), "")
    start = None
    for i, line in enumerate(lines):
        if re.match(r"^#{1,6}\s+Thesis\b", line):
            start = i + 1
            break
        if line.startswith("**Thesis.**"):
            start = i
            break
    if start is None:
        return heading, "<p>No thesis section found in the README.</p>"
    body = []
    for line in lines[start:]:
        if line.startswith("#"):
            break
        body.append(line.replace("**Thesis.** ", "", 1))
    return heading, block_md(body)


def diff_line(prev: Map | None, cur: Map) -> str:
    """Plain summary of what changed from the previous iteration."""
    if prev is None:
        return ""
    before = {n.name: n for n in prev.nodes.values() if n.kind != "anchor"}
    after = {n.name: n for n in cur.nodes.values() if n.kind != "anchor"}
    parts = []
    added = [n for n in after if n not in before]
    gone = [n for n in before if n not in after]
    moved = [
        f"{n} {before[n].mat:.2f} to {after[n].mat:.2f}"
        for n in after
        if n in before and abs(before[n].mat - after[n].mat) >= 0.005
    ]
    if added:
        parts.append(f"<b>Added:</b> {esc(', '.join(added))}.")
    if gone:
        parts.append(f"<b>Removed:</b> {esc(', '.join(gone))}.")
    if moved:
        parts.append(f"<b>Maturity changed:</b> {esc('; '.join(moved))}.")
    old_arrows = {(e.name, e.mat) for e in prev.evolves}
    arrows = [f"{e.name} to {e.mat:.2f}" for e in cur.evolves if (e.name, e.mat) not in old_arrows]
    dropped = sorted({e.name for e in prev.evolves} - {e.name for e in cur.evolves})
    if arrows:
        parts.append(f"<b>New evolve arrows:</b> {esc('; '.join(arrows))}.")
    if dropped:
        parts.append(f"<b>Arrows gone:</b> {esc(', '.join(dropped))}.")
    if not parts:
        parts.append("No component added, removed or moved along evolution, and no arrow changed.")
    return " ".join(parts)


PAGE_CSS = """
:root { color-scheme: light; --ink:#1f2933; --soft:#52606d; --line:#d9e2ec; --bg:#fff; --tint:#f6f7f9; --warn:#fff4d6; --warn-line:#e0b34a; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.55 'Noto Sans', 'Helvetica Neue', Arial, sans-serif; }
main { max-width: 1392px; margin: 0 auto; padding: 24px 16px 80px; }
h1 { font-size: 30px; line-height: 1.2; margin: 0 0 14px; }
h2 { font-size: 25px; line-height: 1.25; margin: 0 0 6px; scroll-margin-top: 58px; }
h3 { font-size: 17px; margin: 0 0 2px; scroll-margin-top: 58px; }
.banner { background: var(--warn); border: 1px solid var(--warn-line); border-radius: 6px; padding: 12px 16px; margin: 0 0 18px; max-width: 78ch; }
.banner p { margin: 0 0 8px; } .banner p:last-child { margin: 0; }
nav { position: sticky; top: 0; z-index: 2; background: var(--bg); border-bottom: 1px solid var(--line); padding: 8px 0; margin-bottom: 18px; font-size: 14px; display: flex; flex-wrap: wrap; gap: 4px 16px; }
nav a { color: var(--ink); white-space: nowrap; }
.candidate { border-top: 3px solid var(--ink); padding-top: 18px; margin-top: 46px; }
.tag { display: inline-block; font-size: 13px; color: var(--soft); margin-bottom: 4px; }
.thesis { max-width: 78ch; margin-bottom: 26px; }
.thesis p, .thesis ul { margin: 0 0 10px; }
.iteration { margin: 0 0 40px; }
.iteration p { margin: 0 0 6px; max-width: 110ch; font-size: 14.5px; color: var(--soft); }
.iteration .files { font-size: 13px; }
.iteration svg { display: block; width: 100%; height: auto; border: 1px solid var(--line); border-radius: 4px; margin-top: 8px; }
.report { max-width: 110ch; font-size: 14.5px; }
.report summary { cursor: pointer; font-weight: 600; }
.report ul { margin: 6px 0 12px; padding-left: 20px; }
code { font-size: 0.92em; background: var(--tint); padding: 0 3px; border-radius: 3px; }
"""


def report_html(groups) -> str:
    maps = [m for _, _, group in groups for m in group]
    lines = sum(m.line_count for m in maps)
    unparsed = [(m, item) for m in maps for item in m.unparsed]
    problems = [(m, p) for m in maps for p in m.problems]
    layout = [(m, p) for m in maps for p in m.layout]

    def rel(m: Map) -> str:
        return f"{m.path.parent.name}/{m.path.name}"

    parts = [
        '<section class="report" id="report"><h2>Syntax report</h2>',
        f"<p>{len(maps)} maps, {lines} non-blank lines. <b>{len(unparsed)}</b> lines could not be parsed. "
        f"<b>{len(problems)}</b> parsed lines have a reference or range problem. "
        f"<b>{len(layout)}</b> placement issues are specific to this preview.</p>",
    ]
    parts.append("<p>A clean result here means this script's own subset parser accepted the file. "
                 "It does not show that the real renderers accept it.</p>")
    renamed = [(m, e) for m in maps for e in m.evolves if e.target_name != e.name]
    if renamed:
        parts.append("<p>Worth a look in the real renderer, because this script guessed the meaning: "
                     "<code>evolve A-&gt;B</code> is drawn as A moving and being relabelled B.</p><ul>" + "".join(
            f"<li><code>{esc(rel(m))}</code>: {esc(e.name)} to {esc(e.target_name)}</li>"
            for m, e in renamed) + "</ul>")
    if unparsed:
        parts.append("<ul>" + "".join(
            f"<li><code>{esc(rel(m))}:{n}</code> <code>{esc(text)}</code>: {esc(why)}</li>"
            for m, (n, text, why) in unparsed) + "</ul>")
    if problems:
        parts.append("<ul>" + "".join(
            f"<li><code>{esc(rel(m))}</code>: {esc(p)}</li>" for m, p in problems) + "</ul>")
    if layout:
        parts.append(f"<details><summary>Preview placement issues ({len(layout)})</summary><ul>" + "".join(
            f"<li><code>{esc(rel(m))}</code>: {esc(p)}</li>" for m, p in layout) + "</ul></details>")
    parts.append("</section>")
    return "\n".join(parts)


def gallery(groups, out: Path) -> str:
    def rel(p: Path) -> str:
        return Path(*_relative(p, out.parent)).as_posix()

    nav = "".join(f'<a href="#{esc(slug)}">{esc(slug)} ({len(group)})</a>' for slug, _, group in groups)
    sections = []
    for slug, readme, group in groups:
        heading, thesis = read_thesis(readme)
        tag = "Dissent" if slug.startswith("dissent") else "Scenario"
        body = [
            f'<section class="candidate" id="{esc(slug)}">',
            f'<span class="tag">{tag} · {len(group)} iterations · '
            f'<a href="{esc(rel(readme))}">README</a></span>',
            f"<h2>{esc(heading or slug)}</h2>",
            f'<div class="thesis">{thesis}</div>',
        ]
        prev = None
        for m in group:
            svg_path = m.path.with_suffix(".svg")
            stem = m.path.stem
            summary = " ".join(m.comments)
            change = diff_line(prev, m)
            body.append(f'<article class="iteration" id="{esc(slug)}-{esc(stem)}">')
            body.append(f"<h3>{esc(stem)}: {esc(m.title)}</h3>")
            if summary:
                body.append(f"<p>{esc(summary)}</p>")
            if change:
                body.append(f"<p>{change}</p>")
            body.append(
                f'<p class="files"><a href="{esc(rel(m.path))}">.owm</a> · '
                f'<a href="{esc(rel(svg_path))}">.svg</a></p>'
            )
            body.append(svg_path.read_text(encoding="utf-8"))
            body.append("</article>")
            prev = m
        body.append("</section>")
        sections.append("\n".join(body))

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Candidate Map Gallery</title>
<style>{PAGE_CSS}</style>
</head>
<body>
<main>
<h1>Easy Is Taken: candidate landscapes</h1>
<div class="banner">
<p><strong>This is a rough preview renderer.</strong> It is a small script written for tonight's run. onlinewardleymaps.com or the VS Code extension is the real check.</p>
<p>Expect differences there. Label positions, the wrapping of notes and the leader lines are this script's own, and the real renderers will likely look more crowded. Links from an evolved position are not drawn. Stage boundaries (0.175, 0.40, 0.70) are the defaults as remembered, not checked against the OWM source. Component positions are exactly what each <code>.owm</code> file says.</p>
<p>"Writing software is a utility" is a supposition and my reading, in every candidate that uses it. See each candidate's README for the evidence behind a placement, and <a href="landscape-comparison.md">landscape-comparison.md</a> for where the candidates disagree.</p>
</div>
<nav>{nav}<a href="#report">syntax report</a></nav>
{"".join(sections)}
<div style="height:46px"></div>
{report_html(groups)}
</main>
</body>
</html>
"""


def _relative(path: Path, start: Path) -> list[str]:
    path_parts, start_parts = path.resolve().parts, start.resolve().parts
    common = 0
    while common < min(len(path_parts), len(start_parts)) and path_parts[common] == start_parts[common]:
        common += 1
    return [".."] * (len(start_parts) - common) + list(path_parts[common:])


# ---------------------------------------------------------------- main


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--root", type=Path, default=REPO / "maps" / "candidates")
    parser.add_argument("--gallery", type=Path, default=REPO / "research" / "gallery.html")
    args = parser.parse_args()

    folders = sorted({p.parent for p in args.root.rglob("*.owm")},
                     key=lambda p: (p.name.startswith("dissent"), p.name))
    groups = []
    for folder in folders:
        group = []
        for path in sorted(folder.glob("*.owm")):
            m = parse(path)
            path.with_suffix(".svg").write_text(render(m), encoding="utf-8")
            group.append(m)
        groups.append((folder.name, folder / "README.md", group))

    args.gallery.parent.mkdir(parents=True, exist_ok=True)
    args.gallery.write_text(gallery(groups, args.gallery), encoding="utf-8")

    maps = [m for _, _, group in groups for m in group]
    print(f"rendered {len(maps)} maps from {len(groups)} candidates; gallery at {args.gallery}")
    for m in maps:
        name = f"{m.path.parent.name}/{m.path.name}"
        for number, text, why in m.unparsed:
            print(f"UNPARSED {name}:{number}: {text} ({why})")
        for problem in m.problems:
            print(f"PROBLEM  {name}: {problem}")
        if m.layout:
            print(f"layout   {name}: {len(m.layout)} preview placement issues")
    return 0


if __name__ == "__main__":
    sys.exit(main())
