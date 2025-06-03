import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageVisitsComponent } from './manage-visits.component';

describe('ManageVisitsComponent', () => {
  let component: ManageVisitsComponent;
  let fixture: ComponentFixture<ManageVisitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageVisitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageVisitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
