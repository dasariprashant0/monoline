import {Button} from '@monoline/react'; // a server component can render non-interactive parts directly
import {Demo} from './demo';

export default function Page() {
  return (
    <main>
      <Button variant="line">Rendered on the server</Button>
      <Demo />
    </main>
  );
}
