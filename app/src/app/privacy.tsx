import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Paper, Title } from '../components/ui';
import { CONTACT_EMAIL, POLICY_DATE } from '../lib/config';
import { useLang } from '../lib/lang';
import { C, COL } from '../lib/theme';

type Section = { h: string; p: string[] };

const EN: Section[] = [
  {
    h: 'The short version',
    p: [
      'ALIBI has no accounts, no ads, no tracking and no in-app purchases. We never ask for your email, phone number, real name, location, contacts, photos or microphone.',
      'The little we handle exists only to run the game, and most of it never leaves your device.',
    ],
  },
  {
    h: 'What stays on your device',
    p: [
      'Your detective name and avatar, your language and sound settings, how many Practice games you have played (to show tips to newcomers), and the code of the last room you joined.',
      'If you answer the age question, we keep only whether you are under 13, never your age. Under-13 players can only use preset detective names.',
      'Practice games against bots run entirely on your device.',
    ],
  },
  {
    h: 'What is sent when you play with friends',
    p: [
      'To run a room, your device sends our game server a random player ID made on your device, your detective name and your avatar. Other players in the room see your name and avatar.',
      'Names are checked by a filter, and offensive names are replaced with a detective name.',
      'Room data is deleted automatically after 6 hours without activity.',
    ],
  },
  {
    h: 'Reports and game statistics',
    p: [
      'If someone reports a player name, we receive the room code, the reported name and the time, so we can improve the name filter.',
      'When a game ends we receive anonymous numbers: how many players and bots, rounds, settings, how often the Liar was caught, and how long the game took. They contain no names or IDs and are used only to balance the game.',
      'These records are kept in our hosting provider’s logs for a limited time and are not shared with anyone else.',
    ],
  },
  {
    h: 'Our hosting provider',
    p: [
      'The game runs on Cloudflare. Like any website or online service, Cloudflare processes technical data such as IP addresses to deliver and protect the service, under its own privacy policy. We do not use IP addresses to identify you.',
    ],
  },
  {
    h: 'Children',
    p: [
      'ALIBI is made for families. It does not require any personal information to play, under-13 players get preset names only, and there is no chat. We do not knowingly collect personal information from children.',
      'A parent can remove everything ALIBI stored on a device by deleting the app or clearing the site’s data. If you have a question, contact us below.',
    ],
  },
  {
    h: 'We never',
    p: ['Sell or rent data · show ads · use advertising or analytics SDKs · track you across apps or websites · build profiles about you.'],
  },
  {
    h: 'Changes and contact',
    p: ['If this policy changes, we will update this page and its date.'],
  },
];

const ES: Section[] = [
  {
    h: 'En pocas palabras',
    p: [
      'ALIBI no tiene cuentas, ni anuncios, ni rastreo, ni compras dentro de la app. Nunca pedimos tu correo, teléfono, nombre real, ubicación, contactos, fotos ni micrófono.',
      'Lo poco que manejamos existe solo para que funcione el juego, y casi todo se queda en tu dispositivo.',
    ],
  },
  {
    h: 'Lo que se queda en tu dispositivo',
    p: [
      'Tu nombre de detective y tu avatar, tu idioma y el sonido, cuántas partidas de práctica has jugado (para mostrar consejos a los nuevos) y el código de la última sala.',
      'Si respondes la pregunta de edad, solo guardamos si tienes menos de 13 años, nunca tu edad. Los menores de 13 solo usan nombres de detective predefinidos.',
      'Las partidas de práctica contra bots se juegan completamente en tu dispositivo.',
    ],
  },
  {
    h: 'Lo que se envía al jugar con amigos',
    p: [
      'Para que funcione una sala, tu dispositivo envía a nuestro servidor un ID de jugador aleatorio creado en tu dispositivo, tu nombre de detective y tu avatar. Los demás jugadores de la sala ven tu nombre y avatar.',
      'Los nombres pasan por un filtro y los ofensivos se cambian por un nombre de detective.',
      'Los datos de la sala se borran solos tras 6 horas sin actividad.',
    ],
  },
  {
    h: 'Reportes y estadísticas',
    p: [
      'Si alguien reporta un nombre, recibimos el código de sala, el nombre reportado y la hora, para mejorar el filtro.',
      'Al terminar una partida recibimos números anónimos: cuántos jugadores y bots, rondas, ajustes, cuántas veces atraparon al Mentiroso y cuánto duró. No contienen nombres ni IDs y solo sirven para equilibrar el juego.',
      'Estos registros se guardan por tiempo limitado en los registros de nuestro proveedor y no se comparten con nadie más.',
    ],
  },
  {
    h: 'Nuestro proveedor',
    p: [
      'El juego funciona en Cloudflare. Como cualquier sitio o servicio en línea, Cloudflare procesa datos técnicos como direcciones IP para entregar y proteger el servicio, según su propia política de privacidad. No usamos las direcciones IP para identificarte.',
    ],
  },
  {
    h: 'Niños',
    p: [
      'ALIBI está hecho para familias. No hace falta ningún dato personal para jugar, los menores de 13 usan nombres predefinidos y no hay chat. No recopilamos a sabiendas datos personales de niños.',
      'Un padre o madre puede borrar todo lo que ALIBI guardó en un dispositivo eliminando la app o los datos del sitio. Si tienes preguntas, escríbenos abajo.',
    ],
  },
  {
    h: 'Nunca',
    p: ['Vendemos ni alquilamos datos · mostramos anuncios · usamos SDK de publicidad o analítica · te rastreamos entre apps o sitios · creamos perfiles sobre ti.'],
  },
  {
    h: 'Cambios y contacto',
    p: ['Si esta política cambia, actualizaremos esta página y su fecha.'],
  },
];

export default function Privacy() {
  const { lang } = useLang();
  const sections = lang === 'es' ? ES : EN;
  return (
    <ScrollView contentContainerStyle={{ ...COL, padding: 16, gap: 12, paddingBottom: 40 }}>
      <Pressable onPress={() => router.replace('/')} hitSlop={10}>
        <Text style={{ color: C.manila, fontSize: 16 }}>← ALIBI</Text>
      </Pressable>
      <Title>{lang === 'es' ? 'Política de privacidad' : 'Privacy policy'}</Title>
      <Text style={{ color: C.muted, textAlign: 'center', fontSize: 15 }}>
        {lang === 'es' ? 'Vigente desde ' : 'Effective '}
        {POLICY_DATE}
      </Text>
      {sections.map((s) => (
        <Paper key={s.h} style={{ gap: 6 }}>
          <Text style={{ fontWeight: '800', fontSize: 17, color: C.ink }}>{s.h}</Text>
          {s.p.map((p, i) => (
            <Text key={i} style={{ fontSize: 16, lineHeight: 23, color: C.ink }}>
              {p}
            </Text>
          ))}
        </Paper>
      ))}
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text style={{ color: C.manila, fontSize: 16 }}>
          {lang === 'es' ? 'Contacto: ' : 'Contact: '}
          {CONTACT_EMAIL}
        </Text>
      </View>
    </ScrollView>
  );
}
