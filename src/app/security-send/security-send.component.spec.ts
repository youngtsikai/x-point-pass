import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecuritySendComponent } from './security-send.component';

describe('SecuritySendComponent', () => {
  let component: SecuritySendComponent;
  let fixture: ComponentFixture<SecuritySendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecuritySendComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecuritySendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
