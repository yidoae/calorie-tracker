/*
 * Anecdotes and quotes from well-known athletes for the landing page. Only widely documented
 * stories and attributed quotes; each card names where it comes from. Translations are ours, the
 * original wording is kept next to them. No photos: the cards are typographic (monograms).
 */

export interface Legend {
  id: string;
  name: string;
  /** Two letters for the monogram. */
  initials: string;
  discipline: string;
  /** One-line claim to fame. */
  title: string;
  anecdote: string;
  quote: { tr: string; original: string } | null;
  source: string;
  /** How the idea shows up in the app. */
  inApp: string;
}

export const LEGENDS: Legend[] = [
  {
    id: "arnold",
    name: "Arnold Schwarzenegger",
    initials: "AS",
    discipline: "Vücut geliştirme",
    title: "7 kez Mr. Olympia",
    anecdote:
      "Graz'da genç bir sporcuyken, salonun kapalı olduğu pazar günleri bile içeri girip antrenman yaptığını anlatır. Programını aksatmamak, onun için kuralları esnetmeye değecek kadar önemliydi.",
    quote: {
      tr: "Son üç dört tekrar, kası büyüten şeydir. Acının olduğu bu bölge, şampiyonu şampiyon olmayandan ayırır.",
      original: "The last three or four reps is what makes the muscle grow. This area of pain divides the champion from someone else who is not a champion.",
    },
    source: "Pumping Iron (1977) belgeseli",
    inApp: "Antrenman günlerinde daha fazla karbonhidrat: plandaki kalori döngüsü.",
  },
  {
    id: "ronnie",
    name: "Ronnie Coleman",
    initials: "RC",
    discipline: "Vücut geliştirme",
    title: "8 kez üst üste Mr. Olympia (1998–2005)",
    anecdote:
      "Teksas'ın Arlington kentinde polis memuruyken, MetroFlex salonunun sahibi Brian Dobson ona bir yarışmaya birlikte hazırlanmaları karşılığında ücretsiz üyelik teklif etti. Coleman o yıl Mr. Texas'ı kazandı; gerisi tarih.",
    quote: {
      tr: "Herkes vücut geliştirmeci olmak ister ama kimse o ağırlıkları kaldırmak istemez.",
      original: "Everybody wants to be a bodybuilder, but don't nobody want to lift no heavy-ass weights.",
    },
    source: "Antrenman videoları (1990'lar–2000'ler)",
    inApp: "Protein halkası minimum hedeftir: ağır antrenmanın karşılığını tabağında ver.",
  },
  {
    id: "ali",
    name: "Muhammad Ali",
    initials: "MA",
    discipline: "Boks",
    title: "3 kez ağır sıklet dünya şampiyonu",
    anecdote:
      "12 yaşında Louisville'de bisikleti çalınınca, hırsızı dövmek istediğini bir polise, Joe Martin'e söyledi. Martin ona önce dövüşmeyi öğrenmesini önerdi ve onu kendi boks salonuna aldı.",
    quote: {
      tr: "Antrenmanın her dakikasından nefret ettim ama kendime 'Bırakma. Şimdi acı çek, hayatının geri kalanını şampiyon olarak yaşa' dedim.",
      original: "I hated every minute of training, but I said, 'Don't quit. Suffer now and live the rest of your life as a champion.'",
    },
    source: "Ali'ye atfedilen, sık alıntılanan söz",
    inApp: "Seriler ceza değil, hatırlatma: kaçırdığın bir gün sıfır sayılmaz.",
  },
  {
    id: "lalanne",
    name: "Jack LaLanne",
    initials: "JL",
    discipline: "Fitness öncüsü",
    title: '"Fitness\'ın babası"',
    anecdote:
      "1974'te, 60 yaşındayken, elleri kelepçeli ve ayakları zincirliyken bir tekneyi çekerek Alcatraz'dan San Francisco'daki Fisherman's Wharf'a kadar yüzdü.",
    quote: {
      tr: "Egzersiz kraldır, beslenme kraliçedir. İkisini bir araya getir, bir krallığın olur.",
      original: "Exercise is king. Nutrition is queen. Put them together and you've got a kingdom.",
    },
    source: "Röportajları ve televizyon programı",
    inApp: "Makrolar, mikro besinler ve su: kraliçenin tamamı tek ekranda.",
  },
  {
    id: "kipchoge",
    name: "Eliud Kipchoge",
    initials: "EK",
    discipline: "Maraton",
    title: "Maratonu 2 saatin altında koşan ilk insan",
    anecdote:
      "12 Ekim 2019'da Viyana'da 42,195 km'yi 1:59:40'ta koştu. Yıllardır her antrenmanını bir deftere el yazısıyla kaydettiği biliniyor: mesafe, süre, nasıl hissettiği.",
    quote: { tr: "Hiçbir insan sınırlı değildir.", original: "No human is limited." },
    source: "INEOS 1:59 Challenge, Viyana 2019",
    inApp: "Onun defteri, senin günlüğün: her öğünü kaydet, trendleri izle.",
  },
  {
    id: "naim",
    name: "Naim Süleymanoğlu",
    initials: "NS",
    discipline: "Halter",
    title: '"Cep Herkülü", 3 olimpiyat altını',
    anecdote:
      "1988 Seul Olimpiyatları'nda 60 kg sıkletinde silkmede 190 kg kaldırdı: kendi vücut ağırlığının üç katından fazlası. 1988, 1992 ve 1996'da üst üste üç olimpiyat şampiyonluğu kazandı.",
    quote: null,
    source: "Seul 1988 Olimpiyat sonuçları",
    inApp: "Güç, doğru yakıtla gelir: plan sihirbazı hedefine göre protein ve kalori belirler.",
  },
];
