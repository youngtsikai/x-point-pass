import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminFlagComponent } from './admin-flag.component';

describe('AdminFlagComponent', () => {
  let component: AdminFlagComponent;
  let fixture: ComponentFixture<AdminFlagComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminFlagComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminFlagComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
