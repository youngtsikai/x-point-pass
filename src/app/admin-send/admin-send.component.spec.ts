import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSendComponent } from './admin-send.component';

describe('AdminSendComponent', () => {
  let component: AdminSendComponent;
  let fixture: ComponentFixture<AdminSendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSendComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
