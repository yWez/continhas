#!/usr/bin/env python3
"""Sincroniza as abas públicas do Google Sheets com o dashboard Continhas."""

from __future__ import annotations

import csv
import html
import io
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path

PUBLISHED_BASE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQeboumr1it6uT_7ml6R2W1lQN9TVSwn6ewjhe1XmcbYbjVDzs0mKHrCpXt_8DbpvNth4F4kwI1gB-K"
OUTPUT_FILE = Path(__file__).resolve().parents[1] / "latest-data.js"

KNOWN_SHEETS = {
    "Cartão - Geral": 831498501,
    "Compras - Junho": 1138847875,
    "Compras - Julho": 836365473,
    "Compras - Agosto": 2050672183,
}

MONTH_ORDER = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]


class PublishedTabParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.tabs: dict[str, int] = {}
        self._gid: int | None = None
        self._text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = dict(attrs)
        href = attrs_dict.get("href") or ""
        match = re.search(r"(?:[?&]|^)gid=(\d+)", href)
        if tag == "a" and match:
            self._gid = int(match.group(1))
            self._text = []

    def handle_data(self, data: str) -> None:
        if self._gid is not None:
            self._text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "a" and self._gid is not None:
            name = html.unescape("".join(self._text)).strip()
            if name:
                self.tabs[name] = self._gid
            self._gid = None
            self._text = []


def fetch_text(url: str) -> str:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Continhas GitHub Sync)"},
    )
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.read().decode("utf-8-sig")


def discover_sheets() -> dict[str, int]:
    html_text = fetch_text(f"{PUBLISHED_BASE}/pubhtml")
    parser = PublishedTabParser()
    parser.feed(html_text)
    tabs = dict(parser.tabs)

    # Fallbacks para variações do HTML publicado pelo Google.
    patterns = [
        r"gid=(\d+)[^>]{0,300}>([^<>]{1,100})</a>",
        r'"sheetId"\s*:\s*(\d+).{0,250}?"name"\s*:\s*"([^"]+)"',
        r'"name"\s*:\s*"([^"]+)".{0,250}?"sheetId"\s*:\s*(\d+)',
    ]
    for index, pattern in enumerate(patterns):
        for match in re.finditer(pattern, html_text, flags=re.I | re.S):
            if index == 2:
                name, gid = match.group(1), match.group(2)
            else:
                gid, name = match.group(1), match.group(2)
            clean_name = html.unescape(re.sub(r"<[^>]+>", "", name)).strip()
            if clean_name:
                tabs.setdefault(clean_name, int(gid))

    return tabs


def csv_url(gid: int) -> str:
    query = urllib.parse.urlencode({"gid": gid, "single": "true", "output": "csv"})
    return f"{PUBLISHED_BASE}/pub?{query}"


def parse_money(value: str | float | int | None) -> float:
    if value is None:
        return 0.0
    raw = str(value).strip().replace("R$", "").replace(" ", "")
    if not raw:
        return 0.0
    if "," in raw:
        raw = raw.replace(".", "").replace(",", ".")
    raw = re.sub(r"[^0-9.-]", "", raw)
    try:
        return round(float(raw), 2)
    except ValueError:
        return 0.0


def read_csv(gid: int) -> list[list[str]]:
    text = fetch_text(csv_url(gid))
    return list(csv.reader(io.StringIO(text)))


def parse_purchases(rows: list[list[str]]) -> list[list[object]]:
    if not rows:
        return []
    header = [cell.strip() for cell in rows[0]]
    positions = {name: index for index, name in enumerate(header)}

    required = ["Data", "Estabelecimento", "Categoria", "Local", "Dono"]
    if not all(name in positions for name in required):
        raise ValueError(f"Cabeçalhos inesperados: {header}")

    value_column = positions.get("Valor (R$)", positions.get("Valor"))
    if value_column is None:
        raise ValueError(f"Coluna de valor não encontrada: {header}")

    output: list[list[object]] = []
    for row in rows[1:]:
        padded = row + [""] * max(0, len(header) - len(row))
        establishment = padded[positions["Estabelecimento"]].strip()
        value = parse_money(padded[value_column])
        if not establishment and not value:
            continue
        output.append([
            padded[positions["Data"]].strip(),
            establishment,
            value,
            padded[positions["Categoria"]].strip() or "Sem categoria",
            padded[positions["Local"]].strip() or "Não informado",
            padded[positions["Dono"]].strip() or "Não informado",
        ])
    return output


def parse_overview(rows: list[list[str]]) -> list[dict[str, object]]:
    output: list[dict[str, object]] = []
    for row in rows[1:]:
        padded = row + [""] * max(0, 7 - len(row))
        month = padded[0].strip()
        if not month or month.upper() == "TOTAL":
            continue
        value = parse_money(padded[1])
        if not value:
            continue
        output.append({
            "mes": month,
            "valor": value,
            "wesley": parse_money(padded[3]),
            "analu": parse_money(padded[4]),
            "casal": parse_money(padded[5]),
            "loja": parse_money(padded[6]),
        })
    return output


def month_sort_key(name: str) -> tuple[int, str]:
    month = name.replace("Compras - ", "").strip()
    try:
        return MONTH_ORDER.index(month), month
    except ValueError:
        return 99, month


def main() -> None:
    discovered = discover_sheets()
    sheets = {**KNOWN_SHEETS, **discovered}

    overview_gid = sheets.get("Cartão - Geral")
    if overview_gid is None:
        raise RuntimeError("A aba Cartão - Geral não foi encontrada na publicação.")

    purchase_sheets = sorted(
        ((name, gid) for name, gid in sheets.items() if name.startswith("Compras - ")),
        key=lambda item: month_sort_key(item[0]),
    )
    if not purchase_sheets:
        raise RuntimeError("Nenhuma aba Compras - Mês foi encontrada.")

    months: dict[str, list[list[object]]] = {}
    for name, gid in purchase_sheets:
        rows = parse_purchases(read_csv(gid))
        if rows:
            months[f"Fatura {name.replace('Compras - ', '').strip()}"] = rows
            print(f"{name}: {len(rows)} lançamentos")

    payload = {
        "updatedAt": datetime.utcnow().strftime("%Y-%m-%d"),
        "monthlyOverview": parse_overview(read_csv(overview_gid)),
        "months": months,
    }
    output = "const LATEST_FINANCE_DATA=" + json.dumps(
        payload, ensure_ascii=False, separators=(",", ":")
    ) + ";\n"
    OUTPUT_FILE.write_text(output, encoding="utf-8")
    print(f"Arquivo atualizado: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
