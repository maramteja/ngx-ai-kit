import { TestBed } from '@angular/core/testing';

import { NgxAiKitService } from './ngx-ai-kit.service';

describe('NgxAiKitService', () => {
  let service: NgxAiKitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxAiKitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
