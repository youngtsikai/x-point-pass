import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorSendComponent } from './visitor-send.component';

describe('VisitorSendComponent', () => {
  let component: VisitorSendComponent;
  let fixture: ComponentFixture<VisitorSendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorSendComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitorSendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
