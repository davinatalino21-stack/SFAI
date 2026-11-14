import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fair_context import (
    classificar_documento_feira,
    documento_compativel_com_feiras,
    identificar_feiras_mencionadas,
    montar_consulta_busca_feira,
    pergunta_exige_busca_web_feira,
    resolver_feira_conversa,
)


class TestContextoFeira(unittest.TestCase):
    def test_identifica_mostratec_como_nome_proprio(self):
        self.assertEqual(
            identificar_feiras_mencionadas("O que é a MOSTRATEC?"),
            ["MOSTRATEC"],
        )

    def test_mostra_tecnologica_generica_nao_vira_mostratec(self):
        self.assertEqual(
            identificar_feiras_mencionadas("Uma mostra tecnológica escolar."),
            [],
        )

    def test_follow_up_pronominal_mantem_feira(self):
        historico = [
            {"remetente": "user", "conteudo": "O que é a MOSTRATEC?"},
        ]
        self.assertEqual(
            resolver_feira_conversa("Como participo dela?", historico),
            ["MOSTRATEC"],
        )

    def test_mencao_explicita_troca_a_feira(self):
        historico = [
            {"remetente": "user", "conteudo": "O que é a MOSTRATEC?"},
        ]
        self.assertEqual(
            resolver_feira_conversa("E a FEBRACE?", historico),
            ["FEBRACE"],
        )

    def test_assunto_desconectado_interrompe_contexto_antigo(self):
        historico = [
            {"remetente": "user", "conteudo": "O que é a MOSTRATEC?"},
            {"remetente": "user", "conteudo": "Quanto é 12 vezes 8?"},
        ]
        self.assertEqual(
            resolver_feira_conversa("Qual é o prazo?", historico),
            [],
        )

    def test_documento_potiguar_nao_e_mostratec(self):
        feira_doc = classificar_documento_feira(
            "Avaliacao de trabalhos.pdf",
            "Feira de Ciências Ciência para Todos no Semi-Árido Potiguar. "
            "Orientações para avaliadores.",
        )
        self.assertEqual(feira_doc, "CIENCIA_PARA_TODOS")
        self.assertFalse(documento_compativel_com_feiras(feira_doc, ["MOSTRATEC"]))

    def test_documento_generico_pode_ser_reutilizado(self):
        feira_doc = classificar_documento_feira(
            "Referencias.pdf",
            "Orientações sobre referências bibliográficas e normas da ABNT.",
        )
        self.assertEqual(feira_doc, "GERAL")
        self.assertTrue(documento_compativel_com_feiras(feira_doc, ["MOSTRATEC"]))

    def test_pergunta_pronominal_aciona_web_com_feira_resolvida(self):
        self.assertTrue(
            pergunta_exige_busca_web_feira("Como participo dela?", ["MOSTRATEC"])
        )

    def test_consulta_web_recebe_nome_da_feira(self):
        consulta = montar_consulta_busca_feira(
            "Como participo dela?",
            ["MOSTRATEC"],
        )
        self.assertIn("MOSTRATEC", consulta)
        self.assertIn("regulamento", consulta)


if __name__ == "__main__":
    unittest.main()
