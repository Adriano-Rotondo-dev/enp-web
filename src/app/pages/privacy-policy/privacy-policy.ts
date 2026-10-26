import { Component, OnDestroy } from '@angular/core';
import { Meta } from '@angular/platform-browser'
 
@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [],
  templateUrl: './privacy-policy.html'
})
export class PrivacyPolicyComponent implements OnDestroy {
  constructor(private meta: Meta){
this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' })
}

  ngOnDestroy() {
    // evita che il noindex resti sulle pagine visitate dopo (navigazione SPA)
    this.meta.removeTag("name='robots'");
  }
}