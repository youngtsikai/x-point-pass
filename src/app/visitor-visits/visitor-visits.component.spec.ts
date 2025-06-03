import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorVisitsComponent } from './visitor-visits.component';

describe('VisitorVisitsComponent', () => {
  let component: VisitorVisitsComponent;
  let fixture: ComponentFixture<VisitorVisitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorVisitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitorVisitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
