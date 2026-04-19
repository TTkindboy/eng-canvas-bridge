import { client } from '../../lib/client/client.gen';

client.setConfig({
  baseUrl: import.meta.env.WXT_API_URL ?? 'http://localhost:8000',
  credentials: 'include',
});

export async function handleAddToCalendar() {
  alert('Button clicked!');
}
