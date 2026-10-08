(() => {
  'use strict';

  const doc = document.documentElement;
  doc.classList.add('js');

  const WHATSAPP = '5584992081542';
  const menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Horário de funcionamento em horas decimais, por dia da semana (0 = domingo)
  const HORARIOS = {
    0: [6.5, 20.5],
    1: [6, 21], 2: [6, 21], 3: [6, 21], 4: [6, 21], 5: [6, 21],
    6: [6, 21.5],
  };
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  const dois = (n) => String(n).padStart(2, '0');
  const horaTexto = (h) => {
    const cheia = Math.floor(h);
    const min = Math.round((h - cheia) * 60);
    return min ? `${cheia}h${dois(min)}` : `${cheia}h`;
  };

  // A hora que vale é a de Natal, não a do aparelho de quem visita
  const formatoNatal = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Fortaleza', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  function agoraEmNatal() {
    const partes = Object.fromEntries(formatoNatal.formatToParts(new Date()).map((p) => [p.type, p.value]));
    const dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(partes.weekday);
    const hora = Number(partes.hour);
    const minuto = Number(partes.minute);
    return { dia, hora, minuto, decimal: hora + minuto / 60 };
  }

  function faseDoMomento({ dia, decimal }) {
    const [abre, fecha] = HORARIOS[dia];
    if (decimal < abre) {
      return { aberto: false, titulo: `A padaria abre às ${horaTexto(abre)}.`, texto: 'O forno já está aceso para a primeira fornada.', status: `Fechado agora. Abre hoje às ${horaTexto(abre)}` };
    }
    if (decimal >= fecha) {
      const amanha = (dia + 1) % 7;
      return { aberto: false, titulo: 'Fechamos por hoje.', texto: `Amanhã, ${DIAS[amanha]}, o pão sai de novo às ${horaTexto(HORARIOS[amanha][0])}.`, status: `Fechado agora. Abre amanhã às ${horaTexto(HORARIOS[amanha][0])}` };
    }
    const status = `Aberto agora, até as ${horaTexto(fecha)}`;
    if (decimal < 10.5) return { aberto: true, titulo: 'Hora do café da manhã.', texto: 'O buffet está posto e o pão acabou de sair.', status };
    if (decimal < 15) {
      const texto = dia === 2 ? 'Hoje é terça: tem feijoada no buffet.' : 'O buffet de almoço está servido.';
      return { aberto: true, titulo: 'Hora do almoço.', texto, status };
    }
    if (decimal < 18) return { aberto: true, titulo: 'Hora do café da tarde.', texto: 'Café passado, torta na vitrine e pão quentinho.', status };
    return { aberto: true, titulo: 'Hora do jantar.', texto: 'Prato quente no buffet e pão da última fornada.', status };
  }

  /* ---------- Hero e status ao vivo ---------- */
  const elRelogio = document.getElementById('hero-relogio');
  const elTitulo = document.getElementById('hero-fase-titulo');
  const elTexto = document.getElementById('hero-fase-texto');
  const statusEls = [document.getElementById('status-hero'), document.getElementById('status-visite')];

  function atualizarAgora() {
    const agora = agoraEmNatal();
    const fase = faseDoMomento(agora);
    elRelogio.textContent = `${dois(agora.hora)}:${dois(agora.minuto)}`;
    elTitulo.textContent = fase.titulo;
    elTexto.textContent = fase.texto;
    statusEls.forEach((el) => {
      if (!el) return;
      el.dataset.aberto = fase.aberto ? 'sim' : 'nao';
      el.querySelector('.status__texto').textContent = fase.status;
    });
    document.querySelectorAll('.horarios tr').forEach((tr) => {
      tr.classList.toggle('is-hoje', tr.dataset.dias.split(',').includes(String(agora.dia)));
    });
  }
  atualizarAgora();
  setInterval(atualizarAgora, 15000);

  /* ---------- Entrada da hero e vídeo ---------- */
  const video = document.querySelector('.hero__video');
  if (video && !menosMovimento) {
    video.play().catch(() => { /* sem autoplay, o pôster continua no lugar */ });
  }
  requestAnimationFrame(() => requestAnimationFrame(() => doc.classList.add('pronto')));

  /* ---------- Topo ---------- */
  const topo = document.getElementById('topo');
  const botaoMenu = topo.querySelector('.topo__menu');
  const fecharMenu = () => {
    topo.classList.remove('is-aberto');
    botaoMenu.setAttribute('aria-expanded', 'false');
    botaoMenu.querySelector('.sr-only').textContent = 'Abrir menu';
  };
  botaoMenu.addEventListener('click', () => {
    const aberto = topo.classList.toggle('is-aberto');
    botaoMenu.setAttribute('aria-expanded', String(aberto));
    botaoMenu.querySelector('.sr-only').textContent = aberto ? 'Fechar menu' : 'Abrir menu';
  });
  topo.querySelectorAll('.nav a').forEach((a) => a.addEventListener('click', fecharMenu));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharMenu(); });

  /* ---------- O dia: o relógio anda com a rolagem ---------- */
  const secaoDia = document.getElementById('dia');
  const momentos = Array.from(document.querySelectorAll('.momento'));
  const ponteiroHora = document.getElementById('ponteiro-hora');
  const ponteiroMin = document.getElementById('ponteiro-min');
  const digital = document.getElementById('relogio-digital');
  const nomeFase = document.getElementById('relogio-fase');

  const marcas = document.getElementById('relogio-marcas');
  for (let i = 0; i < 12; i += 1) {
    const linha = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const forte = i % 3 === 0;
    linha.setAttribute('x1', '100'); linha.setAttribute('x2', '100');
    linha.setAttribute('y1', '10'); linha.setAttribute('y2', forte ? '24' : '17');
    linha.setAttribute('stroke-width', forte ? '3' : '1.5');
    linha.setAttribute('transform', `rotate(${i * 30} 100 100)`);
    marcas.appendChild(linha);
  }

  function horaDaRolagem() {
    const meio = window.innerHeight * 0.5;
    let hora = Number(momentos[0].dataset.hora);
    let atual = momentos[0];
    for (let i = 0; i < momentos.length; i += 1) {
      const caixa = momentos[i].getBoundingClientRect();
      const inicio = Number(momentos[i].dataset.hora);
      const fim = Number(momentos[i].dataset.fim || (momentos[i + 1] && momentos[i + 1].dataset.hora) || inicio);
      if (meio >= caixa.top) {
        const t = Math.min(1, Math.max(0, (meio - caixa.top) / caixa.height));
        hora = inicio + (fim - inicio) * t;
        atual = momentos[i];
      }
    }
    return { hora, atual };
  }

  function atualizarDia() {
    const { hora, atual } = horaDaRolagem();
    const h = Math.floor(hora);
    const m = Math.floor((hora - h) * 60);
    ponteiroHora.style.transform = `rotate(${(hora % 12) * 30}deg)`;
    ponteiroMin.style.transform = `rotate(${(hora - Math.floor(hora)) * 360 + Math.floor(hora) * 360}deg)`;
    digital.textContent = `${dois(h)}:${dois(m)}`;
    nomeFase.textContent = atual.dataset.nome;
    if (secaoDia.dataset.fase !== atual.dataset.fase) secaoDia.dataset.fase = atual.dataset.fase;
  }

  // O relógio começa centrado no primeiro horário e para centrado no último;
  // a hora continua correndo porque depende só da rolagem.
  const trilho = document.getElementById('relogio-trilho');
  const relogio = trilho.querySelector('.relogio');
  function medirTrava() {
    const folga = (momento) => `${Math.max(0, (momento.offsetHeight - relogio.offsetHeight) / 2)}px`;
    trilho.style.setProperty('--trava-inicio', folga(momentos[0]));
    trilho.style.setProperty('--trava', folga(momentos[momentos.length - 1]));
  }
  medirTrava();
  window.addEventListener('resize', medirTrava);
  window.addEventListener('load', medirTrava);

  let quadro = 0;
  function aoRolar() {
    if (quadro) return;
    quadro = requestAnimationFrame(() => {
      quadro = 0;
      topo.classList.toggle('is-solido', window.scrollY > window.innerHeight * 0.55);
      atualizarDia();
    });
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  window.addEventListener('resize', aoRolar);
  aoRolar();

  /* ---------- Pedido pelo WhatsApp ---------- */
  const form = document.getElementById('form-pedido');
  const validar = (campo, erroId) => {
    const vazio = !campo.value.trim();
    campo.setAttribute('aria-invalid', String(vazio));
    if (vazio) campo.setAttribute('aria-describedby', erroId); else campo.removeAttribute('aria-describedby');
    document.getElementById(erroId).hidden = !vazio;
    return !vazio;
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const okNome = validar(form.nome, 'erro-nome');
    const okItens = validar(form.itens, 'erro-itens');
    if (!okNome || !okItens) {
      (okNome ? form.itens : form.nome).focus();
      return;
    }
    const linhas = [
      `Olá! Aqui é ${form.nome.value.trim()}. Quero fazer um pedido:`,
      form.itens.value.trim(),
      `Como receber: ${form.modo.value}`,
    ];
    if (form.quando.value.trim()) linhas.push(`Para quando: ${form.quando.value.trim()}`);
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(linhas.join('\n'))}`, '_blank', 'noopener');
  });
  ['nome', 'itens'].forEach((n) => form[n].addEventListener('input', () => {
    if (form[n].getAttribute('aria-invalid') === 'true') validar(form[n], `erro-${n}`);
  }));
})();
