function displayMessage() {
    const urlParams = new URLSearchParams(window.location.search);
    const mensagem = urlParams.get('msg');
    const origem = mensagem === "index" ? 'index.html' : 'Layout.html';

    // Usa o histórico real do navegador quando a página veio do SFAI;
    // caso contrário, cai no destino original.
    if (window.SFAIUI) {
        window.SFAIUI.back(origem);
        return;
    }

    window.location.href = origem;
}
