import {Controller} from 'stimulus';
import App from 'app';
import './<%= componentDirName %>.scss';

class <%= componentCtrlName %> extends Controller {
  static targets = ['title'];
  connect() {
    console.log(`Initialized <%= componentName %>!`);
  }
}

App.register('<%= componentCtrlName %>', <%= componentCtrlName %>);

export default <%= componentCtrlName %>;