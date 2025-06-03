import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorCheckinComponent } from './visitor-checkin.component';

describe('VisitorCheckinComponent', () => {
  let component: VisitorCheckinComponent;
  let fixture: ComponentFixture<VisitorCheckinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorCheckinComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitorCheckinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
