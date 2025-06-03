import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckedinVisitorsComponent } from './checkedin-visitors.component';

describe('CheckedinVisitorsComponent', () => {
  let component: CheckedinVisitorsComponent;
  let fixture: ComponentFixture<CheckedinVisitorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckedinVisitorsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckedinVisitorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
