// Server entry for scripts/ssr.ts: the same Demo per approach, rendered to a string.
import {renderToString} from 'react-dom/server';
import {Demo} from '../demo';
import {styles as modules} from '../modules/styles';
import {styles as panda} from '../panda/styles';
import {styles as plain} from '../plain/styles';
import {styles as ve} from '../ve/styles';

export const render = () => ({
  plain: renderToString(<Demo styles={plain} label="Plain CSS" />),
  modules: renderToString(<Demo styles={modules} label="CSS Modules" />),
  ve: renderToString(<Demo styles={ve} label="Vanilla Extract" />),
  panda: renderToString(<Demo styles={panda} label="Panda CSS" />),
});
