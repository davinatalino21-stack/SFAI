"""Resolução de entidade e classificação segura de documentos do RAG."""

import re


PADROES_FEIRAS = {
    "MOSTRATEC": (
        r"\bmostratec\b",
        r"\bmostra internacional de ci[eê]ncia e tecnologia\b",
    ),
    "FEBRACE": (
        r"\bfebrace\b",
        r"\bfeira brasileira de ci[eê]ncias? e engenharia\b",
    ),
    "CIENCIA_PARA_TODOS": (
        r"\bci[eê]ncias?\s+para\s+todos\b",
        r"\bsemi[aá]rido\s+potiguar\b",
    ),
}

ROTULOS_FEIRAS = {
    "MOSTRATEC": "MOSTRATEC (Mostra Internacional de Ciência e Tecnologia)",
    "FEBRACE": "FEBRACE (Feira Brasileira de Ciências e Engenharia)",
    "CIENCIA_PARA_TODOS": "Feira Ciência para Todos no Semiárido Potiguar",
}

PADRAO_CONTINUACAO_FEIRA = re.compile(
    r"\b(dela|dessa|nessa|essa|ela|a feira|da feira|do evento|"
    r"nesse evento|desse evento|particip\w*|inscri\w*|inscrever|"
    r"prazo|edital|regulamento|categoria|subcategoria|avalia[cç][aã]o|"
    r"avaliador\w*|trabalho|projeto|submeter|submiss[aã]o|estande)\b",
    flags=re.IGNORECASE,
)


def identificar_feiras_mencionadas(texto: str) -> list[str]:
    """Retorna IDs canônicos das feiras explicitamente citadas no texto."""
    texto = str(texto or "")
    return [
        feira
        for feira, padroes in PADROES_FEIRAS.items()
        if any(re.search(padrao, texto, flags=re.IGNORECASE) for padrao in padroes)
    ]


def _ler_campo(objeto, nome: str, padrao=""):
    if isinstance(objeto, dict):
        return objeto.get(nome, padrao)
    return getattr(objeto, nome, padrao)


def mensagem_relacionada_a_feira(texto: str) -> bool:
    """Reconhece referências pronominais e perguntas operacionais sobre a feira."""
    return bool(PADRAO_CONTINUACAO_FEIRA.search(str(texto or "")))


def resolver_feira_conversa(
    mensagem_atual: str,
    mensagens_anteriores,
    feira_selecionada: str = "",
) -> list[str]:
    """Resolve a feira atual sem deixar uma conversa antiga contaminar outro assunto."""
    feiras_atuais = identificar_feiras_mencionadas(mensagem_atual)
    if feiras_atuais:
        return feiras_atuais

    selecionada = identificar_feiras_mencionadas(feira_selecionada)
    if selecionada:
        return selecionada

    for item in reversed(list(mensagens_anteriores or [])):
        if _ler_campo(item, "remetente") != "user":
            continue

        conteudo = str(_ler_campo(item, "conteudo") or "")
        feiras_anteriores = identificar_feiras_mencionadas(conteudo)
        if feiras_anteriores:
            return feiras_anteriores

        if not mensagem_relacionada_a_feira(conteudo):
            break

    return []


def rotulo_contexto_feira(feiras: list[str] | None) -> str:
    """Gera uma descrição explícita e curta da entidade resolvida."""
    feiras = list(feiras or [])
    if not feiras:
        return "Nenhuma feira específica foi identificada nesta conversa."

    rotulos = [ROTULOS_FEIRAS.get(item, item) for item in feiras]
    if len(rotulos) == 1:
        return f"Feira identificada na conversa: {rotulos[0]}."

    return (
        "O usuário mencionou mais de uma feira para comparação: "
        + "; ".join(rotulos)
        + ". Não trate uma delas como se fosse a outra."
    )


def classificar_documento_feira(arquivo: str, texto_documento: str) -> str:
    """Classifica o PDF pelo conjunto de seus chunks, não por um trecho isolado."""
    conteudo = f"{arquivo or ''}\n{texto_documento or ''}"
    feiras = identificar_feiras_mencionadas(conteudo)

    if len(feiras) == 1:
        return feiras[0]
    if len(feiras) > 1:
        return "MULTI"

    padroes_gerais = (
        r"\bABNT\b",
        r"\bnormas? da ABNT\b",
        r"\bm[eé]todo cient[ií]fico\b",
        r"\bmetodologia cient[ií]fica\b",
        r"\brefer[eê]ncias bibliogr[aá]ficas\b",
        r"\bcita[cç][aã]o bibliogr[aá]fica\b",
    )
    if any(
        re.search(padrao, conteudo, flags=re.IGNORECASE)
        for padrao in padroes_gerais
    ):
        return "GERAL"

    padroes_outra_feira = (
        r"\b(feira|mostra|olimp[ií]ada|congresso|simp[oó]sio)\b",
        r"\b(edital|regulamento|inscri[cç][aã]o|submiss[aã]o)\b",
    )
    if any(
        re.search(padrao, conteudo, flags=re.IGNORECASE)
        for padrao in padroes_outra_feira
    ):
        return "OUTRA"

    return "DESCONHECIDA"


def documento_compativel_com_feiras(
    feira_documento: str,
    feiras_contexto: list[str] | None,
) -> bool:
    """Permite apenas a feira ativa e materiais comprovadamente genéricos."""
    feiras_contexto = list(feiras_contexto or [])
    if not feiras_contexto:
        return True
    if feira_documento == "GERAL":
        return True
    if feira_documento == "MULTI":
        return len(feiras_contexto) > 1
    return feira_documento in feiras_contexto


def pergunta_exige_busca_web_feira(
    mensagem: str,
    feiras_contexto: list[str] | None,
) -> bool:
    """Aciona pesquisa externa para identidade e participação em feiras."""
    if not feiras_contexto:
        return False

    padrao = (
        r"\b(o que [ée]|o que significa|sobre|quem organiza|"
        r"como participar|particip\w*|inscri\w*|inscrever|"
        r"edital|regulamento|regras|requisitos|modalidade|"
        r"categorias?|subcategorias?|local(?:iza[cç][aã]o)?)\b"
    )
    return bool(re.search(padrao, str(mensagem or ""), flags=re.IGNORECASE))


def montar_consulta_busca_feira(
    mensagem: str,
    feiras_contexto: list[str] | None,
) -> str:
    """Expande uma pergunta curta com o nome inequívoco da feira."""
    feiras_contexto = list(feiras_contexto or [])
    if not feiras_contexto:
        return str(mensagem or "")

    rotulos = "; ".join(
        ROTULOS_FEIRAS.get(item, item) for item in feiras_contexto
    )
    if re.search(
        r"\b(particip\w*|inscri\w*|inscrever|submiss[aã]o|edital|regulamento)\b",
        str(mensagem or ""),
        flags=re.IGNORECASE,
    ):
        complemento = (
            "como participar, requisitos, inscrições, regulamento e página oficial"
        )
    elif re.search(r"\b(o que [ée]|sobre|significa)\b", str(mensagem or ""), flags=re.IGNORECASE):
        complemento = "descrição oficial, organização e página oficial"
    else:
        complemento = "informações da página oficial"

    return (
        f"{mensagem} | Feira específica: {rotulos}. "
        f"Pesquise {complemento}; não confunda com outras feiras."
    )
