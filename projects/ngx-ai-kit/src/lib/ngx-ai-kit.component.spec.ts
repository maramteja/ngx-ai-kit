import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxAiKitComponent } from './ngx-ai-kit.component';

describe('NgxAiKitComponent', () => {
  let component: NgxAiKitComponent;
  let fixture: ComponentFixture<NgxAiKitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxAiKitComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NgxAiKitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
