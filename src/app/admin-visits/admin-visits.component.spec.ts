import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminVisitsComponent } from './admin-visits.component';

describe('AdminVisitsComponent', () => {
  let component: AdminVisitsComponent;
  let fixture: ComponentFixture<AdminVisitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminVisitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminVisitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
