import { Component } from '@angular/core';
import { Meta } from '@angular/platform-browser'
 
@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [],
  templateUrl: './privacy-policy.html'
})
export class PrivacyPolicyComponent {
  constructor(private meta: Meta){
this.meta.addTag({ name: 'robots', content: 'noindex, nofollow' })
}
}